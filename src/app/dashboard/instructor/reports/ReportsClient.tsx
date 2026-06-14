'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2, Sparkles, Calendar, Users, ExternalLink, ChevronDown, BookOpen, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import { FormalFinalReportDocument } from '@/components/dashboard/instructor/FormalFinalReportPdf';

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

interface FinalReport {
  id: string;
  createdAt: string;
  content: {
    overallScore: number;
    executiveSummary: string;
    technicalEvaluation: string;
    strengths: string[];
    weaknesses: string[];
    studentPerformances: { studentId: string; name: string; score: number; feedback: string }[];
  };
}

interface Team {
  id: string;
  name: string;
  reports: Report[];
  finalReport?: FinalReport | null;
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

  const [generatingFinalReport, setGeneratingFinalReport] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<string | null>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [downloadingTeamId, setDownloadingTeamId] = useState<string | null>(null);

  const executeGenerateReport = async (teamId: string) => {
    setConfirmModalOpen(null);
    setGeneratingFinalReport(teamId);
    try {
      const res = await fetch('/api/ai/analyze-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Rapor oluşturulamadı');
      }
      
      window.location.reload();
    } catch (e: any) {
      setErrorModalMessage(e.message);
    } finally {
      setGeneratingFinalReport(null);
    }
  };

  const handleGenerateFinalReport = (teamId: string) => {
    setConfirmModalOpen(teamId);
  };

  const handleDownloadPdf = async (team: Team) => {
    if (!team.finalReport || !selectedCourse) return;
    try {
      setDownloadingTeamId(team.id);
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <FormalFinalReportDocument report={team.finalReport.content} courseCode={selectedCourse.code} teamName={team.name} />;
      const blob = await pdf(doc).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCourse.code}_Donem_Sonu_Raporu_${team.name.replace(/\s+/g, '_')}.pdf`.replace(/\s+/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorModalMessage('PDF oluşturulurken hata: ' + err.message);
    } finally {
      setDownloadingTeamId(null);
    }
  };

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
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-200">
                      {team.name}
                    </h2>
                    <Badge count={team.reports.length} />
                  </div>
                  
                  {!team.finalReport ? (
                    <button
                      onClick={() => handleGenerateFinalReport(team.id)}
                      disabled={generatingFinalReport === team.id}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      {generatingFinalReport === team.id ? 'Üretiliyor...' : 'Dönem Sonu Raporu Üret'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Dönem Sonu Raporu Hazır
                      </span>
                      <button
                        onClick={() => handleGenerateFinalReport(team.id)}
                        disabled={generatingFinalReport === team.id}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-slate-700"
                        title="Yeni veriler eklendiyse raporu baştan hesapla"
                      >
                        <Sparkles className="w-3 h-3" />
                        {generatingFinalReport === team.id ? 'Güncelleniyor...' : 'Yeniden Üret'}
                      </button>
                    </div>
                  )}
                </div>

                {team.finalReport && (
                  <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-400 mb-2">Dönem Sonu Final Raporu</h3>
                        <p className="text-sm text-emerald-200/70">{new Date(team.finalReport.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleDownloadPdf(team)}
                          disabled={downloadingTeamId === team.id}
                          className="flex items-center gap-2 bg-slate-800/80 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          {downloadingTeamId === team.id ? 'İndiriliyor...' : 'PDF İndir'}
                        </button>
                        <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200">
                          {team.finalReport.content.overallScore} <span className="text-xl text-emerald-500/50">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400" /> Yönetici Özeti</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{team.finalReport.content.executiveSummary}</p>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Teknik Değerlendirme</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{team.finalReport.content.technicalEvaluation}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Güçlü Yönler</h4>
                          <ul className="space-y-2">
                            {team.finalReport.content.strengths?.map((s, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                          <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">Gelişim Alanları</h4>
                          <ul className="space-y-2">
                            {team.finalReport.content.weaknesses?.map((w, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Öğrenci Final Notları</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.finalReport.content.studentPerformances?.map((sp, i) => (
                          <div key={i} className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-semibold text-slate-200">{sp.name}</span>
                              <span className="text-lg font-bold text-emerald-400">{sp.score}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{sp.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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

      {/* Custom Confirm Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b1120] border border-slate-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-indigo-500/10">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Emin misiniz?
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Dönem sonu raporu oluşturmak, tüm dönem verilerini (sprintler, görevler, kodlar) analiz ettiği için uzun sürebilir. Bu işlemi onaylıyor musunuz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalOpen(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => executeGenerateReport(confirmModalOpen)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                Evet, Raporu Üret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Error Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b1120] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/10">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              İşlem Başarısız
            </h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
              {errorModalMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModalMessage(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Anladım
              </button>
            </div>
          </div>
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
