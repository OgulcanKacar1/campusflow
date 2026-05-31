'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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
    
    if (membersError) {
      console.error('Üyeler alınamadı:', membersError);
    }

    // 2. Profile bilgilerini ayrı sorguyla al
    const studentIds = (members || []).map((m: any) => m.student_id);
    let profilesMap: Record<string, { full_name: string; email: string }> = {};
    
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);
      
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
    
    teams.push({
      id: row.team_id,
      courseId,
      name: row.team_name,
      repoUrl: row.repo_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      memberCount: row.member_count,
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
 * Takımdan üye çıkar (soft delete — left_at timestamp)
 */
export async function removeTeamMember(input: RemoveMemberInput): Promise<ActionResult> {
  const supabase = await createClient();
  
  // Takımın dersini bul
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('course_id')
    .eq('id', input.teamId)
    .single();
  
  if (teamError || !team) {
    return { error: 'Takım bulunamadı' };
  }
  
  const { error } = await supabase
    .from('team_members')
    .update({ left_at: new Date().toISOString() })
    .eq('team_id', input.teamId)
    .eq('student_id', input.studentId)
    .is('left_at', null);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath(`/dashboard/instructor/courses/${team.course_id}/teams`);
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
  
  revalidatePath(`/dashboard/instructor/courses/${input.courseId}/teams`);
  return { data: teams };
}
