'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Select components removed in favor of native select for consistency with TaskDialog
import {
  KANBAN_PRIORITIES,
  KANBAN_PRIORITY_LABELS,
  KANBAN_STATUS_DEFINITIONS,
  type KanbanSprint,
  type KanbanTask,
  type TaskPriority,
  type TaskStatus,
} from '@/types/kanban';
import { ConfirmDialog } from './ConfirmDialog';

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprints: KanbanSprint[];
  teamMembers: Array<{ studentId: string; fullName: string | null; email: string | null }>;
  isSubmitting: boolean;
  canManage: boolean;
  onSave: (taskId: string, data: {
    title: string;
    description: string;
    sprintId: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: string | null;
    developerNote: string | null;
  }) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  sprints,
  teamMembers,
  isSubmitting,
  canManage,
  onSave,
  onDelete,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [developerNote, setDeveloperNote] = useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize state when task changes
  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setSprintId(task.sprintId);
      setStatus(task.status);
      setPriority(task.priority);
      setDeveloperNote(task.developerNote ?? '');
      // If task has assignedTo, use it. Otherwise check assignments array.
      setAssignedTo(task.assignedTo ?? task.assignments[0]?.studentId ?? null);
    } else if (!open) {
      setIsDeleteDialogOpen(false);
    }
  }, [open, task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim() || isSubmitting) return;

    await onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      sprintId,
      status,
      priority,
      assignedTo,
      developerNote: developerNote.trim() || null,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!task) return;
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-xl border-slate-800 bg-[#0a1120] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-semibold text-white">Görev Detayı</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="detail-title" className="text-slate-400">Görev Başlığı</Label>
                <Input
                  id="detail-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="örn. API Entegrasyonu"
                  required
                  disabled={!canManage || isSubmitting}
                  className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-description" className="text-slate-400">Açıklama</Label>
                <textarea
                  id="detail-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Görevin detaylarını buraya yazın..."
                  rows={4}
                  disabled={!canManage || isSubmitting}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-developer-note" className="text-slate-400">Geliştirici Notu / Durum Açıklaması</Label>
                <textarea
                  id="detail-developer-note"
                  value={developerNote}
                  onChange={e => setDeveloperNote(e.target.value)}
                  placeholder="Örn: Neden bloke oldu? Ne eksik? Geliştirici buraya not bırakabilir..."
                  rows={3}
                  disabled={!canManage || isSubmitting}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-400">Durum</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    disabled={!canManage || isSubmitting}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {KANBAN_STATUS_DEFINITIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400">Öncelik</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    disabled={!canManage || isSubmitting}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {KANBAN_PRIORITIES.map(key => (
                      <option key={key} value={key}>
                        {KANBAN_PRIORITY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400">Sorumlu Üye</Label>
                  <select
                    value={assignedTo ?? 'none'}
                    onChange={(e) => setAssignedTo(e.target.value === 'none' ? null : e.target.value)}
                    disabled={!canManage || isSubmitting}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="none">Sorumlu Yok</option>
                    {teamMembers.map(member => (
                      <option key={member.studentId} value={member.studentId}>
                        {member.fullName ?? member.email ?? member.studentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400">Sprint</Label>
                  <select
                    value={sprintId ?? 'none'}
                    onChange={(e) => setSprintId(e.target.value === 'none' ? null : e.target.value)}
                    disabled={!canManage || isSubmitting}
                    className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="none">Backlog (Sprint Yok)</option>
                    {sprints.map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 border-t border-slate-800 pt-5 flex flex-col sm:flex-row sm:justify-between items-center gap-4 sm:gap-0 w-full">
              <div className="flex w-full sm:w-auto justify-start">
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isSubmitting}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300 px-3"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Görevi Sil
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Kapat
                </Button>
                {canManage && (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Değişiklikleri Kaydet
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Görevi silmek istediğinize emin misiniz?"
        description={`"${task.title}" görevi kalıcı olarak silinecek.`}
        confirmLabel="Görevi Sil"
        variant="danger"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
