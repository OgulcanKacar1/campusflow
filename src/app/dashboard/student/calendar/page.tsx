import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import { CalendarPageClient } from '../../_shared/calendar/CalendarPageClient';

export default async function StudentCalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // 1. Öğrencinin Takımlarını Çek
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, teams(id, name, course_id, courses(id, name, code))')
    .eq('student_id', user.id);

  const teamList: { id: string; name: string; course_id: string }[] = [];
  const courseMap = new Map<string, { id: string; name: string }>();

  teamMembers?.forEach(tm => {
    const team = tm.teams as any;
    if (team) {
      teamList.push({ id: team.id, name: team.name, course_id: team.course_id });
      if (team.courses) {
        courseMap.set(team.courses.id, { id: team.courses.id, name: team.courses.name, code: team.courses.code });
      }
    }
  });

  const courseList = Array.from(courseMap.values());
  const courseIds = courseList.map(c => c.id);
  const teamIds = teamList.map(t => t.id);

  return (
    <div className="min-h-screen bg-[#0a0f1e] overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-[1600px] mx-auto h-screen flex flex-col">
        <DashboardBreadcrumb items={[{ label: 'Takvim' }]} />
        <div className="mt-4 flex-1">
          <CalendarPageClient
            courseIds={courseIds}
            teamIds={teamIds}
            courses={courseList}
            teams={teamList}
            isInstructor={false}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
