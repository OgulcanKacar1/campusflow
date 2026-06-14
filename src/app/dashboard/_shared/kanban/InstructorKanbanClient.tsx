'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2, Info, LayoutTemplate, GitBranch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { SprintTemplateModal } from '@/components/dashboard/instructor/courses/SprintTemplateModal';
import type { DropResult } from '@hello-pangea/dnd';
import type { KanbanBoardSnapshot, KanbanSprint, KanbanTask, TaskPriority, TaskStatus, SprintStatus } from '@/types/kanban';
import { useKanbanState } from './hooks/useKanbanState';
import { KanbanBoard } from './KanbanBoard';
import { SprintDialog } from './SprintDialog';
import { TaskDialog } from './TaskDialog';
import { TaskDetailDialog } from './TaskDetailDialog';
import { AiReportDialog } from './AiReportDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { moveTask as moveTaskAction, updateCourseSprintMode, updateTeamProjectDetails } from '../../shared/kanban-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { checkGithubConnection, disconnectGithub } from '../../shared/github-actions';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';

interface TeamKanbanClientProps {
  teamId: string;
  teamName: string;
  courseName: string;
  courseCode?: string;
  courseId?: string;
  courseTeams?: { id: string; name: string }[];
  initialSnapshot: KanbanBoardSnapshot;
  initialError?: string | null;
}

export { TeamKanbanClient as InstructorKanbanClient };

export function TeamKanbanClient({
  teamId,
  teamName,
  courseName,
  courseCode,
  courseId,
  courseTeams = [],
  initialSnapshot,
  initialError,
}: TeamKanbanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // ── AI Report UI State ───────────────────────────────────────────────
  const [isAiReportOpen, setAiReportOpen] = useState(false);
  const [aiReportSprint, setAiReportSprint] = useState<{ id: string, name: string } | null>(null);

  // ── Banner ──────────────────────────────────────────────────────────
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    initialError ? { type: 'error', text: initialError } : null,
  );

  // ── Dialog states ───────────────────────────────────────────────────
  const [isSprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [isTaskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isCreatingSprint, setCreatingSprint] = useState(false);
  const [isCreatingTask, setCreatingTask] = useState(false);

  const [isProjectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [projectNameForm, setProjectNameForm] = useState(initialSnapshot.projectName || '');
  const [projectDescForm, setProjectDescForm] = useState(initialSnapshot.projectDescription || '');
  const [isSavingProjectDetails, setIsSavingProjectDetails] = useState(false);

  // ── Task detail & update states ─────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [isUpdatingTask, setUpdatingTask] = useState(false);

  // Sprint silme confirm dialog
  const [sprintToDelete, setSprintToDelete] = useState<KanbanSprint | null>(null);
  const [isDeletingSprint, setDeletingSprint] = useState(false);

  // GitHub connection state
  const [githubState, setGithubState] = useState<{ connected: boolean; loading: boolean }>({
    connected: false,
    loading: true,
  });
  const [isDisconnectingGithub, setIsDisconnectingGithub] = useState(false);

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

  const [localBoard, setLocalBoard] = useState<KanbanBoardSnapshot>(initialSnapshot);
  useEffect(() => {
    setLocalBoard(board);
  }, [board]);

  // Banner auto-dismiss
  useEffect(() => {
    if (!banner || banner.type !== 'success') return;
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  // Check GitHub connection on mount or when returning from OAuth
  useEffect(() => {
    let mounted = true;
    checkGithubConnection(teamId).then((res) => {
      if (mounted) {
        setGithubState({ connected: res.connected, loading: false });
      }
    });
    return () => {
      mounted = false;
    };
  }, [teamId]);

  // Auto-open AI Report if navigated from Reports Archive
  useEffect(() => {
    const openReport = searchParams.get('openReport');
    const sprintIdParam = searchParams.get('sprint');
    
    if (openReport === 'true' && sprintIdParam && board.sprints) {
      const sprint = board.sprints.find(s => s.id === sprintIdParam);
      if (sprint) {
        setAiReportSprint({ id: sprint.id, name: sprint.name });
        setAiReportOpen(true);
        
        // Clean up the URL so it doesn't re-open on refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [board.sprints, searchParams]);

  const isBusy = isRefreshing || isMutating || githubState.loading || isDisconnectingGithub;

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSaveProjectDetails = async () => {
    setIsSavingProjectDetails(true);
    const res = await updateTeamProjectDetails(teamId, projectNameForm, projectDescForm);
    setIsSavingProjectDetails(false);
    if (res.error) {
      handleError(res.error);
    } else {
      handleSuccess('Proje detayları başarıyla kaydedildi.');
      setProjectDetailsOpen(false);
      handleRefresh();
    }
  };

  const handleRefresh = useCallback(() => {
    setBanner(null);
    void actions.refresh();
    checkGithubConnection(teamId).then((res) => {
      setGithubState({ connected: res.connected, loading: false });
    });
  }, [actions, teamId]);

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
      assignees,
    }: {
      title: string;
      description: string;
      sprintId: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      assignees: string[];
    }) => {
      setCreatingTask(true);
      const result = await actions.createTask({
        teamId,
        title,
        description: description.length > 0 ? description : null,
        sprintId,
        status,
        priority,
        assignees,
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

  const handleDisconnectGithub = async () => {
    if (!window.confirm('GitHub bağlantısını kesmek istediğinize emin misiniz? (Mevcut görev logları silinmez, ancak yeni commitler artık gelmez.)')) return;
    
    setIsDisconnectingGithub(true);
    const result = await disconnectGithub(teamId);
    setIsDisconnectingGithub(false);

    if (result.error) {
      handleError(result.error);
    } else {
      handleSuccess('GitHub bağlantısı başarıyla kesildi.');
      setGithubState({ connected: false, loading: false });
    }
  };

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

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const [sourceSprintIdStr, sourceStatus] = source.droppableId.split('::');
      const [destSprintIdStr, destStatus] = destination.droppableId.split('::');

      const sourceSprintId = sourceSprintIdStr === 'backlog' ? null : sourceSprintIdStr;
      const targetSprintId = destSprintIdStr === 'backlog' ? null : destSprintIdStr;

      // Optimistic update
      setLocalBoard((prev) => {
        const next = { ...prev };
        next.sprints = prev.sprints.map(s => ({ ...s, columns: s.columns.map(c => ({ ...c, tasks: [...c.tasks] })) }));
        next.backlogColumns = prev.backlogColumns.map(c => ({ ...c, tasks: [...c.tasks] }));

        let movedTask: KanbanTask | undefined;

        // Find & Remove from source
        if (sourceSprintId === null) {
          const col = next.backlogColumns.find(c => c.status === sourceStatus);
          if (col) movedTask = col.tasks.splice(source.index, 1)[0];
        } else {
          const sprint = next.sprints.find(s => s.id === sourceSprintId);
          if (sprint) {
            const col = sprint.columns.find(c => c.status === sourceStatus);
            if (col) movedTask = col.tasks.splice(source.index, 1)[0];
          }
        }

        if (!movedTask) return prev;
        movedTask.status = destStatus as TaskStatus;
        movedTask.sprintId = targetSprintId;

        // Insert into destination
        if (targetSprintId === null) {
          const col = next.backlogColumns.find(c => c.status === destStatus);
          if (col) col.tasks.splice(destination.index, 0, movedTask);
        } else {
          const sprint = next.sprints.find(s => s.id === targetSprintId);
          if (sprint) {
            const col = sprint.columns.find(c => c.status === destStatus);
            if (col) col.tasks.splice(destination.index, 0, movedTask);
          }
        }

        return next;
      });

      // Background'da server action'ı direkt çağırıyoruz. (Global isMutating tetiklenmesin diye)
      const res = await moveTaskAction({
        teamId,
        taskId: draggableId,
        targetSprintId,
        targetStatus: destStatus as TaskStatus,
        targetPosition: destination.index,
      });

      if (res.error) {
        setBanner({ type: 'error', text: res.error });
        actions.refresh(); // Revert on error
      }
    },
    [actions, teamId]
  );

  const handleUpdateSprintStatus = useCallback(
    async (sprint: KanbanSprint, status: SprintStatus) => {
      const res = await actions.updateSprint({ teamId, sprintId: sprint.id, status });
      if (res.error) {
        setBanner({ type: 'error', text: res.error });
      } else {
        const trStatus = status === 'active' ? 'başlatıldı' : status === 'completed' ? 'tamamlandı' : status;
        handleSuccess(`Sprint başarıyla ${trStatus}.`);
      }
    },
    [actions, teamId, handleSuccess]
  );

  // ── Sprint header renderer ──────────────────────────────────────────
  const renderSprintHeader = useCallback(
    (sprint: KanbanSprint, defaultHeader: React.ReactNode) => {
      if (!board.canManageSprints) return defaultHeader;

      return (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">{defaultHeader}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {sprint.status === 'planning' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateSprintStatus(sprint, 'active')}
                disabled={isBusy}
                className="h-7 px-3 text-[11px] uppercase tracking-wider font-semibold border-emerald-700/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                Sprinti Başlat
              </Button>
            )}
            {courseId && board.isInstructor && (sprint.status === 'completed' || sprint.status === 'active') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAiReportSprint({ id: sprint.id, name: sprint.name });
                  setAiReportOpen(true);
                }}
                disabled={isBusy}
                className={`h-7 px-3 text-[11px] uppercase tracking-wider font-semibold gap-1.5 ${
                  sprint.hasAiReport
                    ? 'border-indigo-700/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300'
                    : 'border-amber-700/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                }`}
                title={sprint.hasAiReport ? "Mevcut Raporu Görüntüle" : "Yapay Zeka ile Öğrenci Katkı Raporu Al"}
              >
                <Sparkles className="h-3 w-3" />
                {sprint.hasAiReport ? 'Raporu Görüntüle' : 'Yeni Rapor Oluştur'}
              </Button>
            )}
            {sprint.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateSprintStatus(sprint, 'completed')}
                disabled={isBusy}
                className="h-7 px-3 text-[11px] uppercase tracking-wider font-semibold border-blue-700/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                Tamamla
              </Button>
            )}
            <button
              onClick={() => setSprintToDelete(sprint)}
              disabled={isBusy}
              aria-label={`${sprint.name} sprintini sil`}
              title="Sprinti Sil"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      );
    },
    [board.canManageSprints, board.isInstructor, courseId, isBusy, handleUpdateSprintStatus],
  );

  // ── Delete confirm dialog content ───────────────────────────────────
  const sprintTaskCount = sprintToDelete
    ? sprintToDelete.columns.reduce((sum, col) => sum + col.tasks.length, 0)
    : 0;

  const deleteDescription = sprintTaskCount > 0
    ? `Bu sprint içinde ${sprintTaskCount} görev var. Görevler backlog'a taşınacak, sprint kalıcı olarak silinecek.`
    : 'Bu sprint boş. Kalıcı olarak silinecek.';

  // ── Render ──────────────────────────────────────────────────────────
  const isInstructorManaged = !board.canManageSprints;

  const breadcrumbItems = [
    { label: 'Derslerim', href: '/dashboard/instructor/courses' },
    { label: courseName, href: courseId ? `/dashboard/instructor/courses/${courseId}` : undefined },
    { label: teamName }
  ];

  return (
    <div className="flex flex-col gap-6 bg-[#050a19] px-6 py-8 min-h-screen">
      {/* Sticky, Glassmorphism Header */}
      <header className="sticky top-0 z-20 flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/40 backdrop-blur-md">
        
        <DashboardBreadcrumb items={breadcrumbItems} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                {teamName}
              </h1>
              {(board.isLeader || board.isInstructor) && (
                <Button variant="ghost" size="sm" onClick={() => setProjectDetailsOpen(true)} className="h-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                  {board.projectName ? 'Proje Detayını Düzenle' : 'Proje Detayı Ekle'}
                </Button>
              )}
            </div>
            {(board.projectName || board.projectDescription) && (
              <p className="text-sm text-slate-400 max-w-2xl mt-1">
                {board.projectName && <strong className="text-slate-300">{board.projectName}</strong>}
                {board.projectName && board.projectDescription && " - "}
                {board.projectDescription}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300"
            >
              {board.canManageTasks ? 'Görev yetkisi aktif' : 'Yalnızca görüntüleme'}
            </Badge>

            {courseId && board.isInstructor && (
              <>
                <div className="flex items-center gap-2 border border-slate-700/50 bg-slate-900/50 rounded-md px-2 py-1">
                  <span className="text-xs text-slate-400">Sprint Yön:</span>
                  <select
                    className="bg-transparent text-xs text-white outline-none cursor-pointer"
                    value={board.sprintMode}
                    onChange={async (e) => {
                      const mode = e.target.value as 'instructor' | 'team';
                      const res = await updateCourseSprintMode(courseId, teamId, mode);
                      if (res.error) {
                        alert(res.error);
                      } else {
                        window.location.reload();
                      }
                    }}
                  >
                    <option value="instructor" className="bg-slate-900">Eğitmen</option>
                    <option value="team" className="bg-slate-900">Takım</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="gap-2 border-indigo-600/50 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Şablon Uygula
                </Button>
              </>
            )}
            
            {board.isLeader && !githubState.loading && (
              githubState.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGithub}
                  disabled={isDisconnectingGithub}
                  className="gap-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bağlantıyı Kes
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/api/github/auth?teamId=${teamId}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
                  }}
                  className="gap-2 border-slate-700 bg-[#24292e]/80 text-white hover:bg-[#24292e] transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  GitHub Bağla
                </Button>
              )
            )}

            {board.canManageSprints && (
                <Button
                  size="sm"
                  onClick={() => setSprintDialogOpen(true)}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Sprint Oluştur
                </Button>
            )}

            {board.canManageTasks && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskDialogOpen(true)}
                  className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  Görev Oluştur
                </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isBusy}
              className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </Button>
          </div>
        </div>

        {/* Team Switcher Tabs */}
        {courseTeams.length > 0 && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {courseTeams.map((t) => {
              const isActive = t.id === teamId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (!isActive) {
                      router.push(`/dashboard/instructor/courses/${courseId}/teams/${t.id}`);
                    }
                  }}
                  className={`flex-shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20 ring-1 ring-indigo-500'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </header>

        {/* Instructor Managed Banner */}
        {isInstructorManaged && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-4 text-sm text-blue-200">
            <Info className="h-5 w-5 shrink-0 text-blue-400" />
            <p className="text-sm text-blue-200/70">
              {board.sprintMode === 'instructor' 
                ? 'Bu panoda sprint planlaması eğitmen tarafından yönetilmektedir. Takım üyesi olarak kendi görevlerinizi ekleyebilir ve durumlarını güncelleyebilirsiniz.'
                : 'Bu panoda sprint planlaması takım lideri tarafından yönetilmektedir. Lütfen sprint planlaması için liderinizle iletişime geçin.'}
            </p>
          </div>
        )}

        {/* Error/Success Banner */}
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

      {/* Kanban board */}
      <div className={isBusy ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
        <KanbanBoard
          board={localBoard}
          isLoading={isBusy}
          error={banner?.type === 'error' ? banner.text : null}
          onDragEnd={handleDragEnd}
          onTaskClick={handleTaskClick}
          renderSprintHeader={renderSprintHeader}
          canMoveTasks={board.canMoveTasks}
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
        sprints={localBoard.sprints}
        teamMembers={localBoard.teamMembers || []}
      />

      <TaskDetailDialog
        task={selectedTask}
        open={isTaskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        sprints={localBoard.sprints}
        teamMembers={localBoard.teamMembers ?? []}
        canManageTasks={board.canManageTasks}
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

      {courseId && (
        <SprintTemplateModal
          courseId={courseId}
          open={isTemplateModalOpen}
          onOpenChange={setIsTemplateModalOpen}
          onSuccess={() => {
            handleSuccess('Şablon tüm takımlara başarıyla uygulandı.');
            handleRefresh();
          }}
        />
      )}

      <Dialog open={isProjectDetailsOpen} onOpenChange={setProjectDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Proje Detayları</DialogTitle>
            <DialogDescription className="text-slate-400">
              Yapay zeka analizinin daha tutarlı olabilmesi için takımın üzerinde çalıştığı projenin konusunu ve amacını belirtin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="projectName" className="text-sm font-medium text-slate-300">Proje Adı</label>
              <input
                id="projectName"
                value={projectNameForm}
                onChange={(e) => setProjectNameForm(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Örn: E-Ticaret Platformu"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="projectDesc" className="text-sm font-medium text-slate-300">Proje Açıklaması ve Amacı</label>
              <textarea
                id="projectDesc"
                value={projectDescForm}
                onChange={(e) => setProjectDescForm(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Takımın genel amacı ve bu projenin neyi çözeceği..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDetailsOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              İptal
            </Button>
            <Button onClick={handleSaveProjectDetails} disabled={isSavingProjectDetails} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSavingProjectDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiReportDialog
        isOpen={isAiReportOpen}
        onOpenChange={setAiReportOpen}
        teamId={teamId}
        sprintId={aiReportSprint?.id || null}
        sprintName={aiReportSprint?.name}
        courseName={courseName}
        courseCode={courseCode}
        teamName={teamName}
      />
    </div>
  );
}
