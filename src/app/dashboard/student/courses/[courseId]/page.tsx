import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ClipboardList, Calendar, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TeamSection } from './TeamSection.client';
import { StudentKanbanClient } from '@/app/dashboard/_shared/kanban/StudentKanbanClient';
import { getKanbanBoard } from '@/app/dashboard/shared/kanban-actions';
import { createEmptyBoardSnapshot } from '@/app/dashboard/_shared/kanban/utils';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import type { Team, TeamMember } from '@/types/team';

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
  created_at: string;
  course_id: string;
  team_members: TeamMemberRow[] | null;
}

async function getCourseDetail(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, code, term, year, section, status, join_code, team_mode, team_min_size, team_max_size, instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) return null;

  const { data: instructor } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', course.instructor_id)
    .single();

  return {
    ...course,
    instructor_name: instructor?.full_name || 'Bilinmiyor',
  };
}

async function getTeamsData(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { teams: [], myTeam: null };

  const { data: teamsData } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      invite_code,
      created_at,
      course_id,
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

  const rawTeams = (teamsData ?? []) as unknown[];

  const teams: Team[] = rawTeams.map((raw) => {
    const team = raw as TeamRow;
    const memberSource = Array.isArray(team.team_members) ? team.team_members : [];
    const members: TeamMember[] = memberSource
      .filter((member) => member.left_at === null)
      .map((member) => ({
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

  return { teams, myTeam };
}

const termLabels: Record<string, string> = {
  fall: 'Güz', spring: 'Bahar', summer: 'Yaz',
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseDetail(courseId);

  if (!course) return notFound();

  const { teams, myTeam } = await getTeamsData(courseId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let kanbanSnapshot = null;
  let kanbanError: string | null = null;

  if (myTeam) {
    const boardResult = await getKanbanBoard(myTeam.id);
    kanbanSnapshot = boardResult.data ?? createEmptyBoardSnapshot(myTeam.id, courseId);
    kanbanError = boardResult.error ?? null;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Breadcrumb */}
        <DashboardBreadcrumb items={[
          { label: 'Derslerim', href: '/dashboard/student/courses' },
          { label: course.name }
        ]} />

        {/* Course Hero */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 mb-2">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-mono text-white/40 tracking-widest uppercase mb-1">{course.code}</p>
              <h1 className="text-4xl font-bold text-white mb-3">{course.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-white/10 text-white/70 border-white/10 font-normal text-sm">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {termLabels[course.term] || course.term} {course.year}
                </Badge>
                {course.section && (
                  <Badge className="bg-white/10 text-white/70 border-white/10 font-normal text-sm">
                    Şube {course.section}
                  </Badge>
                )}
                <Badge className={`font-normal text-sm ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {course.status === 'active' ? 'Aktif' : 'Arşiv'}
                </Badge>
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {course.instructor_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs text-white/40">Hoca</p>
                <p className="text-sm font-semibold text-white">{course.instructor_name}</p>
              </div>
            </div>
          </div>

          {/* Join Code */}
          {course.join_code && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/50">Katılım Kodu:</span>
              <span className="font-mono font-bold tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/20">
                {course.join_code}
              </span>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:[grid-template-columns:minmax(320px,1fr)_minmax(0,2.2fr)] items-start">
          <TeamSection
            courseId={courseId}
            teamMode={course.team_mode as 'instructor' | 'random' | 'student'}
            minSize={course.team_min_size ?? 2}
            maxSize={course.team_max_size ?? 5}
            myTeam={myTeam}
            allTeams={teams}
            currentUserId={user?.id ?? ''}
          />

          {myTeam && kanbanSnapshot ? (
            <StudentKanbanClient
              teamId={myTeam.id}
              teamName={myTeam.name}
              courseName={course.name}
              courseId={courseId}
              initialSnapshot={kanbanSnapshot}
              initialError={kanbanError}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Görevler</h2>
              </div>
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-white/30 text-sm">Henüz görev eklenmedi</p>
                <p className="text-white/20 text-xs mt-1">Hocan görev oluşturduğunda burada görünecek.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
