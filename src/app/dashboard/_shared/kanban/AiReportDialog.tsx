'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Users, GitCommit, Link as LinkIcon } from 'lucide-react';
import type { AiSprintReportContent } from '@/types/kanban';

interface AiReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  sprintId: string | null;
  sprintName?: string;
}

export function AiReportDialog({ isOpen, onOpenChange, teamId, sprintId, sprintName }: AiReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiSprintReportContent | null>(null);

  useEffect(() => {
    if (!isOpen || !sprintId) return;
    
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ai/analyze-sprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, sprintId })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Rapor alınırken bir hata oluştu');
        setReport(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, sprintId, teamId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] md:max-w-4xl max-h-[85vh] overflow-y-auto bg-[#050a14] border-indigo-900/50 text-slate-200 p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-400 pr-10">
            <Sparkles className="h-6 w-6 text-amber-400" />
            {sprintName ? `${sprintName} - AI Analiz Raporu` : 'Sprint AI Analizi'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Yapay zeka bu sprintteki görev atamalarını, commitleri ve paylaşılan dökümanları analiz etti.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-[30px] opacity-20 rounded-full h-16 w-16"></div>
              <Loader2 className="h-16 w-16 text-indigo-400 animate-spin relative z-10" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-indigo-300 font-medium text-lg animate-pulse">Yapay zeka verileri inceliyor...</p>
              <p className="text-sm text-slate-500">Görevler, GitHub commitleri ve döküman bağlantıları analiz ediliyor.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-red-400 bg-red-950/20 rounded-lg border border-red-900/50 m-4">
            <AlertCircle className="h-12 w-12" />
            <p className="font-medium text-center">{error}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-red-900/50 hover:bg-red-900/20 text-red-300">
              Kapat
            </Button>
          </div>
        )}

        {report && !loading && !error && (
          <div className="space-y-8 py-4">
            {/* Score & Summary */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-full md:w-48 p-8 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]">
                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-300 to-purple-400">
                  {report.overallScore}
                </span>
                <span className="text-[10px] font-bold text-indigo-400/80 mt-2 uppercase tracking-[0.2em]">Takım Skoru</span>
              </div>
              <div className="flex-1 space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" /> Genel Değerlendirme
                </h3>
                <p className="text-slate-300/90 leading-relaxed text-sm md:text-base">
                  {report.summary}
                </p>
              </div>
            </div>

            {/* Student Contributions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" /> Bireysel Katkı Analizi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.studentContributions.map((student) => (
                  <Card key={student.studentId} className="bg-slate-900/60 border-slate-800/80 p-5 space-y-5 transition-colors hover:bg-slate-800/40">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{student.fullName}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          <span className="flex items-center gap-1.5" title="Tamamlanan Görevler"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {student.completedTasks} Görev</span>
                          <span className="flex items-center gap-1.5" title="Satır Kod veya Commit Skoru"><GitCommit className="h-3.5 w-3.5 text-indigo-400" /> Skor: {student.linesOfCode}</span>
                          <span className="flex items-center gap-1.5" title="Drive/Figma Bağlantıları"><LinkIcon className="h-3.5 w-3.5 text-amber-500" /> {student.attachmentsAdded} Dosya</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 px-2 py-0.5 whitespace-nowrap">
                        %{student.contributionPercentage} Katkı
                      </Badge>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${student.contributionPercentage}%` }}
                      />
                    </div>
                    
                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 shadow-inner">
                      <span className="text-indigo-400 font-semibold mr-2 block mb-1">AI Notu:</span>
                      {student.feedback}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" /> İyileştirme Tavsiyeleri
              </h3>
              <div className="bg-amber-950/10 border border-amber-900/30 rounded-2xl p-5">
                <ul className="space-y-4">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 bg-amber-500/20 rounded-full p-1 text-amber-400 shrink-0 shadow-[0_0_10px_-2px_rgba(251,191,36,0.3)]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm md:text-base text-amber-100/90 leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
