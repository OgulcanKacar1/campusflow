import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InstructorKanbanClient } from '@/app/dashboard/_shared/kanban/InstructorKanbanClient';
import { createEmptyBoardSnapshot } from '@/app/dashboard/_shared/kanban/utils';
import { getKanbanBoard } from '@/app/dashboard/shared/kanban-actions';

interface PageParams {
  courseId: string;
  teamId: string;
}

interface TeamRecord {
  id: string;
  name: string;
  course_id: string;
  course: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export default async function InstructorTeamKanbanPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { courseId, teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, name, course_id, course:course_id ( id, code, name )')
    .eq('id', teamId)
    .single<TeamRecord>();

  if (teamError || !team || team.course_id !== courseId) {
    notFound();
  }

  // Fetch all teams for the course to enable the Team Switcher
  const { data: allTeams, error: allTeamsError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('course_id', courseId)
    .order('name');
    
  if (allTeamsError || !allTeams) {
    notFound();
  }

  const boardResult = await getKanbanBoard(teamId);
  console.log('[SERVER DEBUG] boardResult:', boardResult);

  if (boardResult.error && boardResult.code === 'NOT_AUTHORIZED') {
    notFound();
  }

  const initialSnapshot = boardResult.data ?? createEmptyBoardSnapshot(teamId, courseId);

  return (
    <InstructorKanbanClient
      teamId={teamId}
      teamName={team.name}
      courseId={courseId}
      courseCode={team.course?.code ?? 'BILINMEYEN'}
      courseName={team.course?.name ?? 'Bilinmeyen Ders'}
      courseTeams={allTeams}
      initialSnapshot={initialSnapshot}
      initialError={boardResult.error}
    />
  );
}
