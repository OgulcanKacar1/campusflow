'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2, Sparkles, Calendar, Users, ExternalLink, ChevronDown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';

interface ReportContent {
  overallScore?: number;
  summary?: string;
  studentContributions?: any[];
}

interface Report {
  id: string;
  sprintId: string;
  sprintName: string;
  createdAt: string;
  score: number;
  summary: string;
  content: ReportContent;
}

interface Team {
  id: string;
  name: string;
  reports: Report[];
}

interface Course {
  id: string;
  code: string;
  name: string;
  teams: Team[];
}

interface ReportsClientProps {
  courses: Course[];
}

export function ReportsClient({ courses }: ReportsClientProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses.length > 0 ? courses[0].id : null
  );

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const hasAnyReportsInCourse = useMemo(() => {
    if (!selectedCourse) return false;
    return selectedCourse.teams.some((t) => t.reports.length > 0);
  }, [selectedCourse]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardBreadcrumb items={[{ label: 'AI Raporları' }]} />
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 shadow-lg shadow-slate-950/40 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <BarChart2 className="w-7 h-7 text-indigo-400" />
            </div>
            AI Rapor Arşivi
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-sm">
            Tüm sınıflarınızdaki takımların yapay zeka analiz raporlarını buradan inceleyebilir, filtreleyerek genel performanslarına göz atabilirsiniz.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-col gap-2 min-w-[280px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ders Seçin
            </label>
            <div className="relative">
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full appearance-none bg-[#0b1120] border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Henüz Dersiniz Yok</h2>
          <p className="text-slate-400 max-w-md text-sm">
            Raporları görüntülemek için öncelikle bir ders oluşturmalı ve takımların sprint koşmasını sağlamalısınız.
          </p>
        </div>
      ) : !selectedCourse ? (
        null
      ) : !hasAnyReportsInCourse ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-700">
            <Sparkles className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Bu Derste Rapor Yok</h2>
          <p className="text-slate-400 max-w-md text-sm">
            Seçili dersteki takımlar için henüz bir yapay zeka analiz raporu oluşturulmamış. Rapor oluşturulduğunda burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {selectedCourse.teams.map((team) => {
            if (team.reports.length === 0) return null;

            return (
              <div key={team.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3">
                  <h2 className="text-xl font-semibold text-slate-200">
                    {team.name}
                  </h2>
                  <Badge count={team.reports.length} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {team.reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col p-6 rounded-2xl border border-slate-800 bg-[#0b1120] hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-500/10 group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">
                              {selectedCourse.code}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                            {report.sprintName}
                          </h3>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                            {report.score}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">
                            Skor
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1">
                        {report.summary}
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-4 h-4" />
                          {report.content?.studentContributions?.length || 0} Üye Analizi
                        </div>
                        <Link
                          href={`/dashboard/instructor/courses/${selectedCourse.id}/teams/${team.id}?sprint=${report.sprintId}&openReport=true`}
                          className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Panoda İncele <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="flex items-center justify-center bg-slate-800 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
      {count} Rapor
    </span>
  );
}
