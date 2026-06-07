'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateInviteCode } from '@/lib/invite';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  Team,
  TeamMember,
  TeamSettings,
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
  RemoveMemberInput,
  CreateRandomTeamsInput,
} from '@/types/team';

// Hata tipi
interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

async function assignInviteCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  options: { force?: boolean } = {}
): Promise<string | null> {
  const { force = false } = options;
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateInviteCode();

    let query = supabase
      .from('teams')
      .update({ invite_code: code })
      .eq('id', teamId);

    if (!force) {
      query = query.is('invite_code', null);
    }

    const { data, error } = await query.select('invite_code').single();

    if (!error && data) {
      return data.invite_code;
    }

    if (error?.code === '23505') {
      // Unique violation → generate a new code and retry
      continue;
    }

    if (!force && (error?.code === 'PGRST116' || error?.details?.includes('Results contain 0 rows'))) {
      const { data: existing } = await supabase
        .from('teams')
        .select('invite_code')
        .eq('id', teamId)
        .single();
      return existing?.invite_code ?? null;
    }

    if (force && (error?.code === 'PGRST116' || error?.details?.includes('Results contain 0 rows'))) {
      // Team not found or update blocked — exit loop
      break;
    }

    if (error) {
      return null;
    }
  }

  return null;
}

function formatPostgrestError(error: PostgrestError | null): string | undefined {
  if (!error) return undefined;
  return error.message || 'Bilinmeyen bir hata oluştu';
}

/**
 * Dersin takım ayarlarını getir
 * RPC yerine direct query — tek row, lightweight
 */
export async function getCourseTeamSettings(courseId: string): Promise<ActionResult<TeamSettings>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('courses')
    .select('team_mode, team_min_size, team_max_size, sprint_mode')
    .eq('id', courseId)
    .single();
  
  if (error || !data) {
    return { error: error?.message || 'Ders ayarları bulunamadı' };
  }
  
  return {
    data: {
      teamMode: data.team_mode as TeamSettings['teamMode'],
      teamMinSize: data.team_min_size || 2,
      teamMaxSize: data.team_max_size || 5,
      sprintMode: data.sprint_mode as TeamSettings['sprintMode'],
    },
  };
}

/**
 * Dersin takım ayarlarını güncelle
 */
export async function updateCourseTeamSettings(
  courseId: string,
  settings: TeamSettings
): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('courses')
    .update({
      team_mode: settings.teamMode,
      team_min_size: settings.teamMinSize,
      team_max_size: settings.teamMaxSize,
      sprint_mode: settings.sprintMode,
    })
    .eq('id', courseId);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${courseId}/teams`);
  return {};
}

/**
 * Dersin tüm takımlarını getir (RPC ile üye sayısı)
 */
export async function getTeamsByCourse(courseId: string): Promise<ActionResult<Team[]>> {
  const supabase = await createClient();
  // RPC: get_course_teams — üye sayısı dahil
  const { data: teamsData, error: teamsError } = await supabase
    .rpc('get_course_teams', { p_course_id: courseId });
  
  if (teamsError) {
    return { error: teamsError.message };
  }
  
  if (!teamsData || teamsData.length === 0) {
    return { data: [] };
  }
  
  const inviteMap = new Map<string, string | null>();
  const { data: inviteRows } = await supabase
    .from('teams')
    .select('id, invite_code')
    .eq('course_id', courseId);
  
  (inviteRows || []).forEach((row) => {
    inviteMap.set(row.id, row.invite_code);
  });
  
  // Her takımın üyelerini ayrı çek
  const teams: Team[] = [];
  
  for (const row of teamsData) {
    // 1. Önce team_members'tan student_id'leri al
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, team_id, student_id, role, joined_at, left_at')
      .eq('team_id', row.team_id)
      .is('left_at', null)
      .order('joined_at', { ascending: true });
    
    // Debug: if (membersError) console.error('Üyeler alınamadı:', membersError);

    // 2. Profile bilgilerini ayrı sorguyla al
    const studentIds = (members || []).map((m: any) => m.student_id);
    let profilesMap: Record<string, { full_name: string; email: string }> = {};
    
    if (studentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);
      
      // Debug: if (profilesError) console.error(`Team ${row.team_id} profiles error:`, profilesError);
      
      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = { full_name: p.full_name || '', email: p.email || '' };
        return acc;
      }, {} as Record<string, { full_name: string; email: string }>);
    }
    
    const formattedMembers: TeamMember[] = (members || []).map((m: any) => ({
      id: m.id,
      teamId: m.team_id,
      studentId: m.student_id,
      role: m.role,
      joinedAt: m.joined_at,
      leftAt: m.left_at,
      studentName: profilesMap[m.student_id]?.full_name,
      studentEmail: profilesMap[m.student_id]?.email,
    }));
    
    let inviteCode = inviteMap.get(row.team_id) ?? null;
    if (!inviteCode) {
      inviteCode = await assignInviteCode(supabase, row.team_id);
      if (inviteCode) {
        inviteMap.set(row.team_id, inviteCode);
      }
    }
    
    teams.push({
      id: row.team_id,
      courseId,
      name: row.team_name,
      repoUrl: row.repo_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      memberCount: row.member_count,
      inviteCode,
      members: formattedMembers,
    });
  }
  
  return { data: teams };
}

/**
 * Yeni takım oluştur (manuel mod) - RPC ile RLS bypass
 */
export async function createTeam(input: CreateTeamInput): Promise<ActionResult<Team>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('create_team', {
      p_course_id: input.courseId,
      p_name: input.name,
      p_repo_url: input.repoUrl || null,
    });
  
  if (error || !data || data.length === 0) {
    return { error: error?.message || 'Takım oluşturulamadı' };
  }
  
  const row = data[0];
  const inviteCode = await assignInviteCode(supabase, row.team_id);
  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/teams`);
  
  return {
    data: {
      id: row.team_id,
      courseId: row.course_id,
      name: row.team_name,
      repoUrl: row.repo_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      inviteCode,
    },
  };
}

/**
 * Takımı güncelle - RPC ile RLS bypass
 */
export async function updateTeam(
  teamId: string,
  courseId: string,
  input: UpdateTeamInput
): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .rpc('update_team', {
      p_team_id: teamId,
      p_name: input.name || null,
      p_repo_url: input.repoUrl || null,
      p_status: input.status || null,
    });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${courseId}/teams`);
  return {};
}

/**
 * Takımı sil - RPC ile RLS bypass
 */
export async function deleteTeam(teamId: string, courseId: string): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .rpc('delete_team', { p_team_id: teamId });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${courseId}/teams`);
  return {};
}

/**
 * Üyeyi takımdan çıkar ve başka takıma ekle
 */
export async function moveTeamMember(
  studentId: string,
  fromTeamId: string,
  toTeamId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  
  // Önce hedef takımın dersini bul (revalidate için)
  const { data: toTeam, error: toTeamError } = await supabase
    .from('teams')
    .select('course_id')
    .eq('id', toTeamId)
    .single();
  
  if (toTeamError || !toTeam) {
    return { error: 'Hedef takım bulunamadı' };
  }
  
  // 1. Eski takımdan sil (student_id ile)
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('student_id', studentId)
    .eq('team_id', fromTeamId);
  
  if (deleteError) {
    return { error: deleteError.message };
  }
  
  // 2. Yeni takıma ekle
  const { error: addError } = await supabase
    .from('team_members')
    .insert({
      team_id: toTeamId,
      student_id: studentId,
      role: 'member'
    });
  
  if (addError) {
    return { error: addError.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${toTeam.course_id}`);
  return {};
}

/**
 * Takıma üye ekle - RPC ile RLS bypass
 */
export async function addTeamMember(input: AddMemberInput): Promise<ActionResult> {
  const supabase = await createClient();
  
  // Önce takımın dersini bul (courseId için revalidate)
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('course_id')
    .eq('id', input.teamId)
    .single();
  
  if (teamError || !team) {
    return { error: 'Takım bulunamadı' };
  }
  
  const { error } = await supabase
    .rpc('add_team_member', {
      p_team_id: input.teamId,
      p_student_id: input.studentId,
    });
  
  if (error) {
    if (error.message.includes('zaten')) {
      return { error: 'Öğrenci bu derste zaten başka bir takımda aktif üye' };
    }
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${team.course_id}/teams`);
  return {};
}

/**
 * Takımdan üye çıkar (soft delete — RPC ile RLS bypass)
 */
export async function removeTeamMember(input: RemoveMemberInput): Promise<ActionResult> {
  const supabase = await createClient();
  
  // RPC ile üye çıkar
  const { error } = await supabase
    .rpc('remove_team_member', {
      p_team_id: input.teamId,
      p_student_id: input.studentId,
    });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${input.teamId}/teams`);
  return {};
}

/**
 * Rastgele takımlar oluştur - RPC ile RLS bypass
 */
export async function createRandomTeams(
  input: CreateRandomTeamsInput
): Promise<ActionResult<Team[]>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('create_random_teams', {
      p_course_id: input.courseId,
      p_team_size: input.teamSize,
      p_prefix: input.teamPrefix || 'Takım',
    });
  
  if (error) {
    return { error: error.message };
  }
  
  if (!data || data.length === 0) {
    return { data: [] };
  }
  
  const teams: Team[] = data.map((row: any) => ({
    id: row.team_id,
    courseId: input.courseId,
    name: row.team_name,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: row.member_count,
  }));

  for (const team of teams) {
    team.inviteCode = await assignInviteCode(supabase, team.id);
  }
  
  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/teams`);
  return { data: teams };
}

export async function regenerateTeamInviteCode(teamId: string): Promise<ActionResult<{ inviteCode: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, course_id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    return { error: formatPostgrestError(teamError) ?? 'Takım bulunamadı' };
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', team.course_id)
    .eq('instructor_id', user.id)
    .single();

  if (courseError || !course) {
    return { error: 'Bu takım üzerinde yetkiniz yok' };
  }

  const inviteCode = await assignInviteCode(supabase, teamId, { force: true });

  if (!inviteCode) {
    return { error: 'Davet kodu oluşturulamadı' };
  }

  revalidatePath(`/dashboard/instructor/courses/${team.course_id}/teams`);
  return { data: { inviteCode } };
}
