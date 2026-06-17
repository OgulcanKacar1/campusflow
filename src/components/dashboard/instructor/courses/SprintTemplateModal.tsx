'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ACADEMIC_SPRINT_TEMPLATES } from '@/lib/constants/sprint-templates';
import { applyCustomSprintsToCourse } from '@/app/dashboard/instructor/actions';

interface SprintTemplateModalProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DraftSprint {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
}

export function SprintTemplateModal({ courseId, open, onOpenChange, onSuccess }: SprintTemplateModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Default end date is 3 months from now
  const defaultEnd = new Date();
  defaultEnd.setMonth(defaultEnd.getMonth() + 3);
  const [endDate, setEndDate] = useState<string>(defaultEnd.toISOString().split('T')[0]);
  
  const [draftSprints, setDraftSprints] = useState<DraftSprint[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedTemplateId(null);
      setDraftSprints([]);
      setError(null);
    }
  }, [open]);

  const handleNext = () => {
    if (!selectedTemplateId || !startDate || !endDate) {
      setError('Lütfen şablon, başlangıç ve bitiş tarihlerini seçin.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }

    const template = ACADEMIC_SPRINT_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) return;

    // Calculate proportional sprints
    const totalDurationWeight = template.sprints.reduce((acc, s) => acc + s.durationInDays, 0);
    const totalMs = end.getTime() - start.getTime();

    let currentStartMs = start.getTime();
    const generated: DraftSprint[] = template.sprints.map((s, index) => {
      const weight = s.durationInDays / totalDurationWeight;
      const sprintMs = totalMs * weight;
      
      const sprintStart = new Date(currentStartMs);
      const sprintEnd = new Date(currentStartMs + sprintMs);
      
      currentStartMs += sprintMs; // Next sprint starts when this one ends

      return {
        id: `draft-${index}`,
        name: s.name,
        start_at: sprintStart.toISOString().split('T')[0],
        end_at: sprintEnd.toISOString().split('T')[0],
      };
    });

    setDraftSprints(generated);
    setError(null);
    setStep(2);
  };

  const handleSprintChange = (index: number, field: 'name' | 'start_at' | 'end_at', value: string) => {
    const newSprints = [...draftSprints];
    
    if (field === 'name') {
      newSprints[index].name = value;
    } else if (field === 'start_at') {
      newSprints[index].start_at = value;
    } else if (field === 'end_at') {
      const oldEndMs = new Date(newSprints[index].end_at).getTime();
      const newEndMs = new Date(value).getTime();
      const deltaMs = newEndMs - oldEndMs;

      newSprints[index].end_at = value;

      // Smart Chain: Shift subsequent sprints by the same delta to avoid overlaps and preserve durations
      for (let i = index + 1; i < newSprints.length; i++) {
        const nextStart = new Date(newSprints[i].start_at).getTime() + deltaMs;
        const nextEnd = new Date(newSprints[i].end_at).getTime() + deltaMs;
        
        newSprints[i].start_at = new Date(nextStart).toISOString().split('T')[0];
        newSprints[i].end_at = new Date(nextEnd).toISOString().split('T')[0];
      }
    }

    setDraftSprints(newSprints);
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    setError(null);

    // Convert YYYY-MM-DD to full ISO strings for the backend
    const sprintsToSubmit = draftSprints.map(s => ({
      name: s.name,
      start_at: new Date(s.start_at).toISOString(),
      end_at: new Date(s.end_at).toISOString(),
    }));

    const result = await applyCustomSprintsToCourse(courseId, sprintsToSubmit);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] bg-card/40 backdrop-blur-xl border-border/60 text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            {step === 1 ? 'Toplu Şablon Uygula' : 'Sprintleri İncele ve Düzenle'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1 
              ? 'Seçtiğiniz proje şablonu, belirlediğiniz tarih aralığına orantısal olarak bölünecektir.'
              : 'Oluşturulan sprintleri aşağıdan kişiselleştirebilirsiniz. Bir sprintin bitiş tarihini uzattığınızda sonrakiler otomatik ötelenir (Akıllı Zincir).'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">1. Şablon Seçin</label>
              <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-track]:bg-transparent">
                {ACADEMIC_SPRINT_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card/50 hover:border-border hover:bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className={`font-medium ${isSelected ? 'text-indigo-300' : 'text-foreground'}`}>
                              {tpl.title}
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                            <p className="mt-2 text-xs font-medium text-muted-foreground">
                              {tpl.sprints.length} Aşamalı Sprint Döngüsü
                            </p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">2. Proje Takvimi</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="mb-1 block text-xs text-muted-foreground">Başlangıç Tarihi</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card/60 py-2 pl-10 pr-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-xs text-muted-foreground">Bitiş Tarihi</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card/60 py-2 pl-10 pr-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-track]:bg-transparent">
            {draftSprints.map((sprint, index) => (
              <div key={sprint.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card/30 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={sprint.name}
                    onChange={(e) => handleSprintChange(index, 'name', e.target.value)}
                    className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-white hover:border-border focus:border-primary focus:bg-card focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground">Başlangıç</span>
                    <input
                      type="date"
                      value={sprint.start_at}
                      onChange={(e) => handleSprintChange(index, 'start_at', e.target.value)}
                      className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-muted-foreground">Bitiş</span>
                    <input
                      type="date"
                      value={sprint.end_at}
                      onChange={(e) => handleSprintChange(index, 'end_at', e.target.value)}
                      className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!selectedTemplateId || !startDate || !endDate}
                className="gap-2 bg-indigo-600 text-white hover:bg-primary"
              >
                Devam Et <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Geri
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={isSubmitting || draftSprints.length === 0}
                className="bg-indigo-600 hover:bg-primary text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Tüm Takımlara Uygula'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
