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

const getScoreStyles = (score: number) => {
  if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50', gradient: 'from-emerald-500/10 to-teal-500/5', textGrad: 'from-emerald-400 to-teal-200', btnHover: 'hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300', span: 'text-emerald-500/50' };
  if (score >= 50) return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hoverBorder: 'hover:border-orange-500/50', gradient: 'from-orange-500/10 to-amber-500/5', textGrad: 'from-orange-400 to-amber-200', btnHover: 'hover:bg-orange-600/20 text-orange-400 hover:text-orange-300', span: 'text-orange-500/50' };
  return { text: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/20', hoverBorder: 'hover:border-slate-500/40', gradient: 'from-slate-500/10 to-transparent', textGrad: 'from-slate-300 to-slate-500', btnHover: 'hover:bg-slate-500/20 text-slate-400 hover:text-slate-200', span: 'text-slate-500/50' };
};

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/40 p-6 rounded-2xl border border-border/60 shadow-lg shadow-slate-950/40 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <BarChart2 className="w-7 h-7 text-primary" />
            </div>
            AI Rapor Arşivi
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-sm">
            Tüm sınıflarınızdaki takımların yapay zeka analiz raporlarını buradan inceleyebilir, filtreleyerek genel performanslarına göz atabilirsiniz.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-col gap-2 min-w-[280px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ders Seçin
            </label>
            <div className="relative">
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full appearance-none bg-card/40 border border-border/60 text-foreground text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer backdrop-blur-sm"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-card">
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border/60 bg-card/40 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Henüz Dersiniz Yok</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Raporları görüntülemek için öncelikle bir ders oluşturmalı ve takımların sprint koşmasını sağlamalısınız.
          </p>
        </div>
      ) : !selectedCourse ? (
        null
      ) : selectedCourse.teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border/60 bg-card/40 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4 border border-border">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Bu Derste Takım Yok</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Seçili derste henüz bir takım oluşturulmamış. Takım oluşturulduğunda burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {selectedCourse.teams.map((team, index) => {


            return (
              <TeamReportAccordion
                key={team.id}
                team={team}
                defaultOpen={index === 0}
                selectedCourse={selectedCourse}
                getScoreStyles={getScoreStyles}
                handleGenerateFinalReport={handleGenerateFinalReport}
                generatingFinalReport={generatingFinalReport}
                handleDownloadPdf={handleDownloadPdf}
                downloadingTeamId={downloadingTeamId}
              />
            );
          })}
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border/60 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Emin misiniz?
            </h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Dönem sonu raporu oluşturmak, tüm dönem verilerini (sprintler, görevler, kodlar) analiz ettiği için uzun sürebilir. Bu işlemi onaylıyor musunuz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalOpen(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted/50 hover:bg-muted border border-border transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => executeGenerateReport(confirmModalOpen)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500 transition-all shadow-lg shadow-primary/20"
              >
                Evet, Raporu Üret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Error Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-destructive/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-destructive/10">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              İşlem Başarısız
            </h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed bg-destructive/5 p-4 rounded-xl border border-destructive/10">
              {errorModalMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModalMessage(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-muted hover:bg-secondary transition-all border border-border"
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

function TeamReportAccordion({
  team,
  selectedCourse,
  getScoreStyles,
  handleGenerateFinalReport,
  generatingFinalReport,
  handleDownloadPdf,
  downloadingTeamId,
  defaultOpen = false
}: {
  team: Team;
  selectedCourse: Course;
  getScoreStyles: (score: number) => any;
  handleGenerateFinalReport: (teamId: string) => void;
  generatingFinalReport: string | null;
  handleDownloadPdf: (team: Team) => void;
  downloadingTeamId: string | null;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const finalScoreStyles = team.finalReport ? getScoreStyles(team.finalReport.content.overallScore) : null;

  return (
    <div className="flex flex-col bg-card/20 border border-border/50 rounded-2xl transition-all shadow-sm">
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer group hover:bg-white/5 transition-colors rounded-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg bg-card border border-border/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            {team.name}
          </h2>
          <Badge count={team.reports.length} />
        </div>
        
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
          {!team.finalReport ? (
            <button
              onClick={() => handleGenerateFinalReport(team.id)}
              disabled={generatingFinalReport === team.id}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              {generatingFinalReport === team.id ? 'Üretiliyor...' : 'Dönem Sonu Raporu Üret'}
            </button>
          ) : (
            <>
              <span className="hidden sm:flex items-center gap-2 text-primary bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-semibold border border-primary/20">
                <CheckCircle2 className="w-4 h-4" /> Dönem Sonu Raporu Hazır
              </span>
              <button
                onClick={() => handleGenerateFinalReport(team.id)}
                disabled={generatingFinalReport === team.id}
                className="flex items-center gap-2 bg-muted hover:bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-border"
                title="Yeni veriler eklendiyse raporu baştan hesapla"
              >
                <Sparkles className="w-3 h-3" />
                {generatingFinalReport === team.id ? 'Güncelleniyor...' : 'Yeniden Üret'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-5 pt-0 border-t border-border/50 mt-2">
            <div className="mt-6">
                {team.finalReport && finalScoreStyles && (
                  <div className={`mb-6 p-6 rounded-2xl bg-gradient-to-br ${finalScoreStyles.gradient} border ${finalScoreStyles.border} shadow-sm backdrop-blur-sm`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className={`text-2xl font-bold ${finalScoreStyles.text} mb-2`}>Dönem Sonu Final Raporu</h3>
                        <p className={`text-sm ${finalScoreStyles.text} opacity-70`}>{new Date(team.finalReport.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleDownloadPdf(team)}
                          disabled={downloadingTeamId === team.id}
                          className={`flex items-center gap-2 bg-muted/80 border px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${finalScoreStyles.btnHover} ${finalScoreStyles.border}`}
                        >
                          <Download className="w-4 h-4" />
                          {downloadingTeamId === team.id ? 'İndiriliyor...' : 'PDF İndir'}
                        </button>
                        <div className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${finalScoreStyles.textGrad}`}>
                          {team.finalReport.content.overallScore} <span className={`text-xl ${finalScoreStyles.span}`}>/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="p-4 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50">
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" /> Yönetici Özeti</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{team.finalReport.content.executiveSummary}</p>
                        </div>
                        <div className="p-4 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50">
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Teknik Değerlendirme</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{team.finalReport.content.technicalEvaluation}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Güçlü Yönler</h4>
                          <ul className="space-y-2">
                            {team.finalReport.content.strengths?.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                          <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">Gelişim Alanları</h4>
                          <ul className="space-y-2">
                            {team.finalReport.content.weaknesses?.map((w, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Öğrenci Final Notları</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.finalReport.content.studentPerformances?.map((sp, i) => {
                          const pStyles = getScoreStyles(sp.score);
                          return (
                            <div key={i} className={`p-4 bg-card/40 backdrop-blur-sm rounded-xl border ${pStyles.border} ${pStyles.hoverBorder} transition-colors`}>
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold text-foreground">{sp.name}</span>
                                <span className={`text-lg font-bold ${pStyles.text}`}>{sp.score}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{sp.feedback}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {team.reports.length === 0 && !team.finalReport ? (
                  <div className="p-8 text-center bg-card/20 rounded-2xl border border-border/50 border-dashed">
                    <p className="text-muted-foreground text-sm">Bu takım için henüz hiçbir yapay zeka raporu (Sprint veya Dönem Sonu) oluşturulmamış.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.reports.map((report) => {
                      const rStyles = getScoreStyles(report.score);
                      return (
                      <div
                        key={report.id}
                        className={`flex flex-col p-6 rounded-2xl border ${rStyles.border} bg-card/40 backdrop-blur-sm ${rStyles.hoverBorder} transition-all shadow-sm group`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-[11px] font-semibold text-primary border border-primary/20">
                                {selectedCourse.code}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <h3 className={`text-lg font-bold text-foreground mt-1 group-hover:${rStyles.text} transition-colors`}>
                              {report.sprintName}
                            </h3>
                          </div>
  
                          <div className="flex flex-col items-end">
                            <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${rStyles.textGrad}`}>
                              {report.score}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                              Skor
                            </div>
                          </div>
                        </div>
  
                        <div className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                          {report.summary}
                        </div>
  
                        <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {report.content?.studentContributions?.length || 0} Üye Analizi
                          </div>
                          <Link
                            href={`/dashboard/instructor/courses/${selectedCourse.id}/teams/${team.id}?sprint=${report.sprintId}&openReport=true`}
                            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-orange-400 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                          >
                            Panoda İncele <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
      {count} Rapor
    </span>
  );
}
