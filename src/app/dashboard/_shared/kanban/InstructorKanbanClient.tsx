'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { KanbanBoardSnapshot, KanbanSprint, TaskPriority, TaskStatus } from '@/types/kanban';
import { useKanbanState } from './hooks/useKanbanState';
import { KanbanBoard } from './KanbanBoard';
import { SprintDialog } from './SprintDialog';
import { TaskDialog } from './TaskDialog';
import { TaskDetailDialog } from './TaskDetailDialog';
import { ConfirmDialog } from './ConfirmDialog';

interface TeamKanbanClientProps {
  teamId: string;
  teamName: string;
  courseName: string;
  initialSnapshot: KanbanBoardSnapshot;
  initialError?: string | null;
}

export { TeamKanbanClient as InstructorKanbanClient };

export function TeamKanbanClient({
  teamId,
  teamName,
  courseName,
  initialSnapshot,
  initialError,
}: TeamKanbanClientProps) {
  // ── Banner ──────────────────────────────────────────────────────────
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    initialError ? { type: 'error', text: initialError } : null,
  );

  // ── Dialog states ───────────────────────────────────────────────────
  const [isSprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [isTaskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isCreatingSprint, setCreatingSprint] = useState(false);
  const [isCreatingTask, setCreatingTask] = useState(false);

  // ── Task detail & update states ─────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [isUpdatingTask, setUpdatingTask] = useState(false);

  // Sprint silme confirm dialog
  const [sprintToDelete, setSprintToDelete] = useState<KanbanSprint | null>(null);
  const [isDeletingSprint, setDeletingSprint] = useState(false);

  // ── Kanban state ────────────────────────────────────────────────────
  const handleError = useCallback((message: string) => {
    setBanner({ type: 'error', text: message });
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setBanner({ type: 'success', text: message });
  }, []);

  const { board, isRefreshing, isMutating, actions } = useKanbanState({
    teamId,
    initialSnapshot,
    onError: handleError,
  });

  // Banner auto-dismiss
  useEffect(() => {
    if (!banner || banner.type !== 'success') return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const isBusy = isRefreshing || isMutating;

  // ── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setBanner(null);
    void actions.refresh();
  }, [actions]);

  const handleSprintSubmit = useCallback(
    async ({ name, startDate, endDate }: { name: string; startDate: string; endDate: string }) => {
      setCreatingSprint(true);
      const result = await actions.createSprint({
        teamId,
        name,
        startAt: new Date(`${startDate}T00:00:00`).toISOString(),
        endAt: new Date(`${endDate}T23:59:59`).toISOString(),
      });
      setCreatingSprint(false);

      if (result.error) {
        setBanner({ type: 'error', text: result.error });
      } else {
        handleSuccess('Sprint oluşturuldu.');
        setSprintDialogOpen(false);
      }
    },
    [actions, teamId, handleSuccess],
  );

  const handleTaskSubmit = useCallback(
    async ({
      title,
      description,
      sprintId,
      status,
      priority,
    }: {
      title: string;
      description: string;
      sprintId: string | null;
      status: TaskStatus;
      priority: TaskPriority;
    }) => {
      setCreatingTask(true);
      const result = await actions.createTask({
        teamId,
        title,
        description: description.length > 0 ? description : null,
        sprintId,
        status,
        priority,
      });
      setCreatingTask(false);

      if (result.error) {
        setBanner({ type: 'error', text: result.error });
      } else {
        handleSuccess('Görev oluşturuldu.');
        setTaskDialogOpen(false);
      }
    },
    [actions, teamId, handleSuccess],
  );

  const handleDeleteSprintConfirm = useCallback(async () => {
    if (!sprintToDelete) return;
    setDeletingSprint(true);
    const result = await actions.deleteSprint({ teamId, sprintId: sprintToDelete.id });
    setDeletingSprint(false);

    if (result.error) {
      setBanner({ type: 'error', text: result.error });
    } else {
      handleSuccess('Sprint silindi. İçindeki görevler backlog\'a taşındı.');
    }
    setSprintToDelete(null);
  }, [actions, teamId, sprintToDelete, handleSuccess]);

  const handleTaskClick = useCallback((task: KanbanTask) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  }, []);

  const handleTaskUpdate = useCallback(
    async (taskId: string, data: any) => {
      setUpdatingTask(true);
      const result = await actions.updateTask({ taskId, teamId, ...data });
      setUpdatingTask(false);

      if (result.error) {
        setBanner({ type: 'error', text: result.error });
      } else {
        handleSuccess('Görev güncellendi.');
        setTaskDetailOpen(false);
        setSelectedTask(null);
      }
    },
    [actions, teamId, handleSuccess],
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      setUpdatingTask(true);
      const result = await actions.deleteTask({ teamId, taskId });
      setUpdatingTask(false);

      if (result.error) {
        setBanner({ type: 'error', text: result.error });
      } else {
        handleSuccess('Görev silindi.');
        setTaskDetailOpen(false);
        setSelectedTask(null);
      }
    },
    [actions, teamId, handleSuccess],
  );

  // ── Sprint header renderer ──────────────────────────────────────────
  const renderSprintHeader = useCallback(
    (sprint: KanbanSprint, defaultHeader: React.ReactNode) => {
      if (!board.canManage) return defaultHeader;

      return (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">{defaultHeader}</div>
          <button
            onClick={() => setSprintToDelete(sprint)}
            disabled={isBusy}
            aria-label={`${sprint.name} sprintini sil`}
            title="Sprinti Sil"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    },
    [board.canManage, isBusy],
  );

  // ── Delete confirm dialog content ───────────────────────────────────
  const sprintTaskCount = sprintToDelete
    ? sprintToDelete.columns.reduce((sum, col) => sum + col.tasks.length, 0)
    : 0;

  const deleteDescription = sprintTaskCount > 0
    ? `Bu sprint içinde ${sprintTaskCount} görev var. Görevler backlog'a taşınacak, sprint kalıcı olarak silinecek.`
    : 'Bu sprint boş. Kalıcı olarak silinecek.';

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 bg-[#050a19] px-6 py-8">
      {/* Page header */}
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sprint & Kanban</p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              {courseName}
              <span className="ml-2 text-sm font-normal text-slate-400">/ {teamName}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300"
            >
              {board.canManage ? 'Yönetici yetkisi aktif' : 'Yalnızca görüntüleme'}
            </Badge>

            {board.canManage && (
              <>
                <Button
                  size="sm"
                  className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                  onClick={() => setSprintDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Sprint Oluştur
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-indigo-500/60 hover:text-white"
                  onClick={() => setTaskDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Görev Oluştur
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-indigo-500/60 hover:text-white"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Yenile
            </Button>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div
            className={`rounded-lg border px-4 py-2 text-sm ${
              banner.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {banner.text}
          </div>
        )}
      </header>

      {/* Kanban board */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 shadow-inner shadow-slate-950/50">
        <KanbanBoard
          board={board}
          isLoading={isBusy}
          error={banner?.type === 'error' ? banner.text : null}
          renderSprintHeader={renderSprintHeader}
          onTaskClick={handleTaskClick}
          headerExtra={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 text-slate-400 hover:text-white"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Yenile
            </Button>
          }
        />
      </div>

      {/* ── Dialoglar ── */}
      <SprintDialog
        open={isSprintDialogOpen}
        onOpenChange={setSprintDialogOpen}
        onSubmit={handleSprintSubmit}
        isSubmitting={isCreatingSprint}
      />

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={handleTaskSubmit}
        isSubmitting={isCreatingTask}
        sprints={board.sprints}
      />

      <TaskDetailDialog
        task={selectedTask}
        open={isTaskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        sprints={board.sprints}
        teamMembers={board.teamMembers ?? []}
        canManage={board.canManage}
        isSubmitting={isUpdatingTask}
        onSave={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />

      <ConfirmDialog
        open={sprintToDelete !== null}
        onOpenChange={(open) => { if (!open) setSprintToDelete(null); }}
        title={`"${sprintToDelete?.name ?? ''}" silinsin mi?`}
        description={deleteDescription}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        variant="danger"
        isConfirming={isDeletingSprint}
        onConfirm={handleDeleteSprintConfirm}
      />
    </div>
  );
}
