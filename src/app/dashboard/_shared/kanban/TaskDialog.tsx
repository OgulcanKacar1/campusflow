'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, User2 } from 'lucide-react';
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
    assignees: string[];
  }) => Promise<void>;
  isSubmitting: boolean;
  sprints: KanbanSprint[];
  teamMembers: Array<{ studentId: string; fullName?: string | null; email?: string | null }>;
}

const DEFAULT_STATUS: TaskStatus = 'todo';
const DEFAULT_PRIORITY: TaskPriority = 'medium';

export function TaskDialog({ open, onOpenChange, onSubmit, isSubmitting, sprints, teamMembers }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(DEFAULT_STATUS);
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_PRIORITY);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleAssignee = (studentId: string) => {
    setAssignees(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle('');
      setDescription('');
      setSelectedSprint('');
      setStatus(DEFAULT_STATUS);
      setPriority(DEFAULT_PRIORITY);
      setAssignees([]);
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
      assignees,
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
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Detaylar, kabul kriterleri veya bağlantılar"
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-slate-400">
                Sorumlu Üyeler
              </Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-1">Takımda üye yok.</p>
                ) : (
                  teamMembers.map((member) => {
                    const isSelected = assignees.includes(member.studentId);
                    return (
                      <button
                        key={member.studentId}
                        type="button"
                        onClick={() => toggleAssignee(member.studentId)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' 
                            : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full ${isSelected ? 'bg-indigo-500/30' : 'bg-slate-700'}`}>
                          {isSelected ? <Check className="h-2.5 w-2.5 text-indigo-300" /> : <User2 className="h-2.5 w-2.5 text-slate-400" />}
                        </div>
                        {member.fullName ?? member.email?.split('@')[0] ?? 'Bilinmeyen Üye'}
                      </button>
                    );
                  })
                )}
              </div>
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
              {isSubmitting ? 'Oluşturuluyor…' : 'Görev Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
