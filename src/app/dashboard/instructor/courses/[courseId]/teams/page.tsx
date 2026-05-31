import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamsPageClient } from '@/components/dashboard/instructor/teams/TeamsPageClient';
import {
  getCourseTeamSettings,
  getTeamsByCourse,
} from '@/app/dashboard/instructor/teams/actions';
import type { TeamSettings } from '@/types/team';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function TeamsPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  // Kullanıcı yetkisini kontrol et
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Dersi kontrol et
  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('id', courseId)
    .single();

  if (!course) {
    notFound();
  }

  // Takım ayarlarını ve mevcut takımları çek
  const [settingsResult, teamsResult] = await Promise.all([
    getCourseTeamSettings(courseId),
    getTeamsByCourse(courseId),
  ]);

  const settings: TeamSettings = settingsResult.data || {
    teamMode: 'instructor',
    teamMinSize: 2,
    teamMaxSize: 5,
    sprintMode: 'instructor',
  };

  const teams = teamsResult.data || [];

  return (
    <TeamsPageClient
      courseId={courseId}
      courseName={course.name}
      initialSettings={settings}
      initialTeams={teams}
    />
  );
}
