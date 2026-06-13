'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; startDate: string; endDate: string }) => Promise<void>;
  isSubmitting: boolean;
}

function getDefaultDates() {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const end = new Date(today);
  end.setDate(end.getDate() + 14);
  const endDate = end.toISOString().slice(0, 10);
  return { startDate, endDate };
}

export function SprintDialog({ open, onOpenChange, onSubmit, isSubmitting }: SprintDialogProps) {
  const defaults = useMemo(() => getDefaultDates(), []);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const freshDefaults = getDefaultDates();
      setName('');
      setStartDate(freshDefaults.startDate);
      setEndDate(freshDefaults.endDate);
      setError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Sprint adı gerekli.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Başlangıç tarihi bitişten sonra olamaz.');
      return;
    }

    setError(null);
    await onSubmit({ name: name.trim(), startDate, endDate });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-[#0f1523] border-slate-800 text-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Sprint Oluştur</DialogTitle>
            <p className="text-sm text-slate-400">
              Takımın için yeni bir sprint planla. Tarihler daha sonra güncellenebilir.
            </p>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="sprint-name" className="text-xs uppercase tracking-widest text-slate-400">
              Sprint Adı
            </Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Örn. Sprint 1"
              className="bg-slate-900/60 border-slate-700 text-white"
              maxLength={60}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sprint-start" className="text-xs uppercase tracking-widest text-slate-400">
                Başlangıç Tarihi
              </Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="bg-slate-900/60 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end" className="text-xs uppercase tracking-widest text-slate-400">
                Bitiş Tarihi
              </Label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="bg-slate-900/60 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:text-white"
              onClick={() => handleOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Oluşturuluyor…' : 'Sprint Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
