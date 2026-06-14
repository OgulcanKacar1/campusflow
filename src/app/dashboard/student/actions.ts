'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Team, TeamMember } from '@/types/team';
import type { StudentCourse } from '@/types/course';

export interface StudentStats {
  enrolledCourses: number;
  activeCourses: number;
  teams: number;
}

interface EnrolledCourseRow {
  enrollment_id: string;
  enrollment_status: string;
  enrolled_at: string;
  course_id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  section: string | null;
  course_status: string;
  join_code: string | null;
  instructor_name: string | null;
}

interface TeamMemberRow {
  id: string;
  student_id: string;
  role: 'member' | 'leader';
  joined_at: string;
  left_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface TeamRow {
  id: string;
  name: string;
  invite_code: string | null;
  project_name?: string | null;
  project_description?: string | null;
  repo_url?: string | null;
  created_at: string;
  team_members: TeamMemberRow[] | null;
}

export async function getStudentStats(): Promise<{ stats?: StudentStats; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // get_my_enrolled_courses RPC fonksiyonunu kullanarak RLS bypass et
  const { data: courses, error } = await supabase
    .rpc('get_my_enrolled_courses');

  if (error) return { error: error.message };

  const courseRows = (courses ?? []) as EnrolledCourseRow[];
  const activeCount = courseRows.filter((c) => c.course_status === 'active').length;

  return {
    stats: {
      enrolledCourses: courseRows.length,
      activeCourses: activeCount,
      teams: 0, // ileride takımlar tablosundan çekilecek
    }
  };
}

export async function getStudentCourses(): Promise<{ data: StudentCourse[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı', data: [] };

  const { data, error } = await supabase.rpc('get_my_enrolled_courses');

  if (error) return { error: error.message, data: [] };

  const courseRows = (data ?? []) as EnrolledCourseRow[];
  const courses = courseRows.map(mapCourseRow);

  return { data: courses };
}

function mapCourseRow(row: EnrolledCourseRow): StudentCourse {
  return {
    enrollmentId: row.enrollment_id,
    enrollmentStatus: row.enrollment_status,
    enrolledAt: row.enrolled_at,
    id: row.course_id,
    code: row.code,
    name: row.name,
    term: row.term,
    year: row.year,
    section: row.section,
    status: row.course_status,
    joinCode: row.join_code,
    instructorName: row.instructor_name ?? 'Bilinmiyor',
  };
}

export async function getMyTeamInCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data, error } = await supabase
    .rpc('get_my_team_in_course', { p_course_id: courseId });

  if (error) return { error: error.message };

  return { data };
}

export async function studentCreateTeam(courseId: string, name?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data, error } = await supabase
    .rpc('student_create_team', {
      p_course_id: courseId,
      p_team_name: name ?? null,
    });

  if (error) return { error: error.message };

  return { data: data?.[0] };
}

export async function studentJoinTeamByInvite(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data, error } = await supabase
    .rpc('student_join_team_by_invite', { p_invite_code: inviteCode.trim().toUpperCase() });

  if (error) return { error: error.message };

  return { data: data?.[0] };
}

export async function studentLeaveTeam(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { error } = await supabase
    .rpc('student_leave_team', { p_team_id: teamId });

  if (error) return { error: error.message };

  return { success: true };
}

export async function getStudentTeamsSnapshot(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: teamsData, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      invite_code,
      project_name,
      project_description,
      repo_url,
      created_at,
      team_members (
        id,
        student_id,
        role,
        joined_at,
        left_at,
        profiles:student_id (
          full_name,
          email
        )
      )
    `)
    .eq('course_id', courseId);

  if (error) return { error: error.message };

  const rawTeams = (teamsData ?? []) as unknown as TeamRow[];

  const teams: Team[] = rawTeams.map((team) => {
    const memberSource = Array.isArray(team.team_members) ? team.team_members : [];
    const members = memberSource
      .filter((member) => member.left_at === null)
      .map<TeamMember>((member) => ({
        id: member.id,
        teamId: team.id,
        studentId: member.student_id,
        role: member.role,
        joinedAt: member.joined_at,
        leftAt: member.left_at,
        studentName: member.profiles?.full_name ?? 'Bilinmiyor',
        studentEmail: member.profiles?.email ?? '—',
      }));

    return {
      id: team.id,
      courseId,
      name: team.name,
      projectName: team.project_name,
      projectDescription: team.project_description,
      repoUrl: team.repo_url,
      inviteCode: team.invite_code,
      status: 'active',
      createdAt: team.created_at,
      updatedAt: team.created_at,
      members,
      memberCount: members.length,
    };
  });

  const myTeam =
    teams.find((team) => team.members?.some((member) => member.studentId === user.id)) || null;

  return { data: { teams, myTeam } };
}

export async function joinCourseByCode(joinCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Katılım koduna sahip aktif dersi bul (RPC ile RLS bypass)
  const { data: courseId, error: rpcError } = await supabase
    .rpc('get_course_by_join_code', { p_join_code: joinCode.trim().toUpperCase() });

  if (rpcError || !courseId) {
    return { error: 'Geçersiz veya süresi dolmuş katılım kodu.' };
  }

  // Zaten kayıtlı mı kontrol et
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single();

  if (existing) return { error: 'Bu derse zaten kayıtlısınız.' };

  // Kaydı oluştur
  const { error } = await supabase
    .from('course_enrollments')
    .insert({ course_id: courseId, student_id: user.id, status: 'enrolled' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function studentUpdateProjectDetails(
  teamId: string,
  projectName: string | null,
  projectDescription: string | null,
  repoUrl: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Kullanıcının takım lideri olduğunu doğrula
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('student_id', user.id)
    .single();

  if (!member || member.role !== 'leader') {
    return { error: 'Sadece takım lideri proje detaylarını güncelleyebilir.' };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('teams')
    .update({
      project_name: projectName,
      project_description: projectDescription,
      repo_url: repoUrl
    })
    .eq('id', teamId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard', 'layout');

  return { success: true };
}

export async function studentTransferLeadership(courseId: string, teamId: string, targetStudentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { error } = await supabase.rpc('student_transfer_leadership', {
    p_team_id: teamId,
    p_target_student_id: targetStudentId,
  });

  if (error) {
    return { error: error.message };
  }

  // Sadece öğrencinin ilgili kurs panosunu invalidate et (ör. courseId var ise)
  return { success: true };
}

export async function getGithubWebhookStatus(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();
  
  const { data: connection } = await adminClient
    .from('github_connections')
    .select('id, webhook_id')
    .eq('team_id', teamId)
    .single();

  if (!connection) return { connected: false, webhookId: null };
  return { connected: true, webhookId: connection.webhook_id };
}
