'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Check, User2, Link as LinkIcon, FileIcon, X } from 'lucide-react';
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
import { MarkdownEditor } from '@/components/ui/markdown-editor';
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
import { addTaskAttachment, removeTaskAttachment } from '../../shared/kanban-actions';

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprints: KanbanSprint[];
  teamMembers: Array<{ studentId: string; fullName: string | null; email: string | null }>;
  isSubmitting: boolean;
  canManageTasks: boolean;
  onSave: (taskId: string, data: {
    title: string;
    description: string;
    sprintId: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignees: string[];
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
  canManageTasks,
  onSave,
  onDelete,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [developerNote, setDeveloperNote] = useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentTitleInput, setAttachmentTitleInput] = useState('');
  const [localAttachments, setLocalAttachments] = useState<any[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isRemovingAttachment, setIsRemovingAttachment] = useState<string | null>(null);

  const toggleAssignee = (studentId: string) => {
    setAssignees(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Initialize state when task changes
  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setSprintId(task.sprintId);
      setStatus(task.status);
      setPriority(task.priority);
      setDeveloperNote(task.developerNote ?? '');
      // Ensure we merge single legacy assignedTo with new assignments if needed
      const initialAssignees = task.assignments.map(a => a.studentId);
      if (task.assignedTo && !initialAssignees.includes(task.assignedTo)) {
        initialAssignees.push(task.assignedTo);
      }
      setAssignees(initialAssignees);
      setLocalAttachments(task.attachments || []);
    } else if (!open) {
      setIsDeleteDialogOpen(false);
      setLocalAttachments([]);
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
      assignees,
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

  const handleAddAttachment = async () => {
    if (!task || !attachmentUrl.trim()) return;
    setIsAttaching(true);
    try {
      const res = await addTaskAttachment({
        teamId: task.teamId,
        taskId: task.id,
        url: attachmentUrl.trim(),
        title: attachmentTitleInput.trim() || undefined
      });
      if (res.error) {
        alert(res.error);
      } else {
        if (res.data) setLocalAttachments(res.data);
        setAttachmentUrl('');
        setAttachmentTitleInput('');
      }
    } catch (err) {
      alert('Bağlantı eklenirken bir hata oluştu.');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!task) return;
    setIsRemovingAttachment(attachmentId);
    try {
      const res = await removeTaskAttachment({
        teamId: task.teamId,
        taskId: task.id,
        attachmentId
      });
      if (res.error) {
        alert(res.error);
      } else {
        if (res.data) setLocalAttachments(res.data);
      }
    } catch (err) {
      alert('Bağlantı silinirken bir hata oluştu.');
    } finally {
      setIsRemovingAttachment(null);
    }
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/40 text-foreground p-6">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl font-bold text-foreground drop-shadow-sm flex items-center gap-2">
                Görev Detayı
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="detail-title" className="text-muted-foreground">Görev Başlığı</Label>
                <Input
                  id="detail-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="örn. API Entegrasyonu"
                  required
                  disabled={!canManageTasks || isSubmitting}
                  className="border-border/50 bg-background/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-description" className="text-muted-foreground">Açıklama</Label>
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Görevin detaylarını buraya yazın..."
                  mode={(!canManageTasks || isSubmitting) ? 'view' : 'edit'}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="detail-developer-note" className="text-muted-foreground">Geliştirici Notu / Durum Açıklaması</Label>
                <MarkdownEditor
                  value={developerNote}
                  onChange={setDeveloperNote}
                  placeholder="Örn: Neden bloke oldu? Ne eksik? Geliştirici buraya not bırakabilir..."
                  mode={(!canManageTasks || isSubmitting) ? 'view' : 'edit'}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground">Eklentiler ve Bağlantılar</Label>
                
                {localAttachments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {localAttachments.map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between p-2 rounded-md bg-card/60 border border-border/50">
                        <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:text-indigo-300 truncate max-w-[80%]">
                          {att.type === 'drive' ? <FileIcon className="h-4 w-4 shrink-0" /> : <LinkIcon className="h-4 w-4 shrink-0" />}
                          <span className="truncate">{att.title}</span>
                        </a>
                        {(canManageTasks && !isSubmitting) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleRemoveAttachment(att.id)}
                            disabled={isRemovingAttachment === att.id}
                          >
                            {isRemovingAttachment === att.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {canManageTasks && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={attachmentTitleInput}
                      onChange={e => setAttachmentTitleInput(e.target.value)}
                      placeholder="Adı (Opsiyonel)"
                      className="bg-card/60 border-border w-[140px] shrink-0"
                      disabled={isAttaching || isSubmitting}
                    />
                    <Input
                      value={attachmentUrl}
                      onChange={e => setAttachmentUrl(e.target.value)}
                      placeholder="Link yapıştırın..."
                      className="bg-background/40 border-border/50 flex-1 min-w-0 focus-visible:ring-primary/40"
                      disabled={isAttaching || isSubmitting}
                    />
                    <Button 
                      type="button"
                      variant="secondary"
                      onClick={handleAddAttachment}
                      disabled={!attachmentUrl.trim() || isAttaching || isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-sm shadow-primary/20 transition-all"
                    >
                      {isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
                    </Button>
                  </div>
                )}
                {canManageTasks && (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Not: Eklediğiniz bağlantıların "Bağlantıya sahip olan herkes görebilir" (Public) şeklinde ayarlandığından emin olun.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Durum</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    disabled={!canManageTasks || isSubmitting}
                    className="w-full rounded-md border border-border/50 bg-background/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {KANBAN_STATUS_DEFINITIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Öncelik</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    disabled={!canManageTasks || isSubmitting}
                    className="w-full rounded-md border border-border/50 bg-background/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {KANBAN_PRIORITIES.map(key => (
                      <option key={key} value={key}>
                        {KANBAN_PRIORITY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Sorumlu Üyeler</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {teamMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-1">Takımda üye yok.</p>
                    ) : (
                      teamMembers.map((member) => {
                        const isSelected = assignees.includes(member.studentId);
                        return (
                          <button
                            key={member.studentId}
                            type="button"
                            onClick={() => toggleAssignee(member.studentId)}
                            disabled={!canManageTasks || isSubmitting}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                              isSelected 
                                ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm shadow-primary/10' 
                                : 'bg-secondary/40 text-muted-foreground border border-border/40 hover:bg-secondary/80 hover:text-foreground'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className={`flex h-4 w-4 items-center justify-center rounded-full ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                              {isSelected ? <Check className="h-2.5 w-2.5 text-primary" /> : <User2 className="h-2.5 w-2.5 text-muted-foreground" />}
                            </div>
                            {member.fullName ?? member.email?.split('@')[0] ?? 'Bilinmeyen Üye'}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Sprint</Label>
                  <select
                    value={sprintId ?? 'none'}
                    onChange={(e) => setSprintId(e.target.value === 'none' ? null : e.target.value)}
                    disabled={!canManageTasks || isSubmitting}
                    className="w-full rounded-md border border-border/50 bg-background/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

            <DialogFooter className="mt-8 border-t border-border pt-5 flex flex-col sm:flex-row sm:justify-between items-center gap-4 sm:gap-0 w-full">
              <div className="flex w-full sm:w-auto justify-start">
                {canManageTasks && (
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
                  className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Kapat
                </Button>
                {canManageTasks && (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
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
