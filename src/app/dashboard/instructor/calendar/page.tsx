import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import { CalendarPageClient } from '../../_shared/calendar/CalendarPageClient';

export default async function InstructorCalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // 1. Hocanın Derslerini Çek
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('instructor_id', user.id);

  const courseList = courses || [];
  const courseIds = courseList.map(c => c.id);

  // 2. Bu derslere bağlı tüm takımları çek
  let teamList: any[] = [];
  if (courseIds.length > 0) {
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, course_id')
      .in('course_id', courseIds);
    
    teamList = teams || [];
  }
  
  const teamIds = teamList.map(t => t.id);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-[1600px] mx-auto h-screen flex flex-col">
        <DashboardBreadcrumb items={[{ label: 'Takvim' }]} />
        <div className="mt-4 flex-1">
          <CalendarPageClient
            courseIds={courseIds}
            teamIds={teamIds}
            courses={courseList}
            teams={teamList}
            isInstructor={true}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
