import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';

export const metadata = {
  title: 'AI Raporları | CampusFlow',
};

export default async function InstructorReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Eğitmenin tüm kurslarını ve bu kurslardaki takımların raporlarını getir
  const { data: coursesData, error } = await supabase
    .from('courses')
    .select(`
      id,
      code,
      name,
      teams (
        id,
        name,
        sprints (
          id,
          name
        ),
        ai_sprint_reports (
          id,
          sprint_id,
          report_content,
          created_at
        ),
        ai_final_reports (
          id,
          report_content,
          created_at
        )
      )
    `)
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
  }

  const courses = (coursesData || []).map(course => ({
    id: course.id,
    code: course.code,
    name: course.name,
    teams: (course.teams || []).map(team => ({
      id: team.id,
      name: team.name,
      reports: (team.ai_sprint_reports || [])
        .map(report => {
          const sprint = (team.sprints || []).find(s => s.id === report.sprint_id);
          const content = report.report_content as any;
          return {
            id: report.id,
            sprintId: report.sprint_id,
            sprintName: sprint?.name || 'Bilinmeyen Sprint',
            createdAt: report.created_at,
            score: content?.overallScore || 0,
            summary: content?.summary || 'Özet bulunmuyor.',
            content
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      finalReport: team.ai_final_reports 
        ? Array.isArray(team.ai_final_reports)
          ? team.ai_final_reports.length > 0 
            ? {
                id: team.ai_final_reports[0].id,
                createdAt: team.ai_final_reports[0].created_at,
                content: team.ai_final_reports[0].report_content
              } 
            : null
          : {
              id: (team.ai_final_reports as any).id,
              createdAt: (team.ai_final_reports as any).created_at,
              content: (team.ai_final_reports as any).report_content
            }
        : null
    }))
  }));

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ReportsClient courses={courses} />
      </div>
    </div>
  );
}
