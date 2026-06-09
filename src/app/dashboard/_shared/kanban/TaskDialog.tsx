'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { KanbanSprint, TaskPriority, TaskStatus } from '@/types/kanban';
import { KANBAN_PRIORITIES, KANBAN_STATUS_DEFINITIONS } from '@/types/kanban';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    title: string;
    description: string;
    sprintId: string | null;
    status: TaskStatus;
    priority: TaskPriority;
  }) => Promise<void>;
  isSubmitting: boolean;
  sprints: KanbanSprint[];
}

const DEFAULT_STATUS: TaskStatus = 'todo';
const DEFAULT_PRIORITY: TaskPriority = 'medium';

export function TaskDialog({ open, onOpenChange, onSubmit, isSubmitting, sprints }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(DEFAULT_STATUS);
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_PRIORITY);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle('');
      setDescription('');
      setSelectedSprint('');
      setStatus(DEFAULT_STATUS);
      setPriority(DEFAULT_PRIORITY);
      setError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Görev başlığı gerekli.');
      return;
    }

    setError(null);
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      sprintId: selectedSprint === '' ? null : selectedSprint,
      status,
      priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg bg-[#0f1523] border-slate-800 text-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Görev Oluştur</DialogTitle>
            <p className="text-sm text-slate-400">
              Görevi backlog&apos;a veya mevcut sprintlerden birine ekleyebilirsin.
            </p>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-xs uppercase tracking-widest text-slate-400">
              Başlık
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Örn. Kullanıcı girişi API"
              className="bg-slate-900/60 border-slate-700 text-white"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description" className="text-xs uppercase tracking-widest text-slate-400">
              Açıklama
            </Label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detaylar, kabul kriterleri veya bağlantılar"
              rows={4}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-sprint" className="text-xs uppercase tracking-widest text-slate-400">
                Sprint
              </Label>
              <select
                id="task-sprint"
                value={selectedSprint}
                onChange={(event) => setSelectedSprint(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">Backlog</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-status" className="text-xs uppercase tracking-widest text-slate-400">
                Durum
              </Label>
              <select
                id="task-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {KANBAN_STATUS_DEFINITIONS.map(({ key, title }) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-priority" className="text-xs uppercase tracking-widest text-slate-400">
              Öncelik
            </Label>
            <select
              id="task-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {KANBAN_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
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
              {isSubmitting ? 'Oluşturuluyor…' : 'Görev Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
