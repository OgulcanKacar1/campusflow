'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  assignTaskMembers,
  createSprint,
  createTask,
  deleteSprint,
  deleteTask,
  getKanbanBoard,
  moveTask,
  removeTaskMember,
  reorderSprints,
  updateSprint,
  updateTask,
} from '../../../shared/kanban-actions';
import type {
  AssignTaskMembersInput,
  CreateSprintInput,
  CreateTaskInput,
  DeleteSprintInput,
  DeleteTaskInput,
  KanbanActionResult,
  KanbanBoardSnapshot,
  KanbanSprint,
  KanbanTask,
  MoveTaskInput,
  RemoveTaskMemberInput,
  ReorderSprintsInput,
  UpdateSprintInput,
  UpdateTaskInput,
} from '@/types/kanban';

interface UseKanbanStateProps {
  teamId: string;
  initialSnapshot: KanbanBoardSnapshot;
  onError?: (message: string) => void;
}

interface KanbanStateActions {
  refresh: () => Promise<KanbanActionResult<KanbanBoardSnapshot>>;
  createSprint: (input: CreateSprintInput) => Promise<KanbanActionResult<KanbanSprint>>;
  updateSprint: (input: UpdateSprintInput) => Promise<KanbanActionResult<KanbanSprint>>;
  deleteSprint: (input: DeleteSprintInput) => Promise<KanbanActionResult<null>>;
  reorderSprints: (input: ReorderSprintsInput) => Promise<KanbanActionResult<null>>;
  createTask: (input: CreateTaskInput) => Promise<KanbanActionResult<KanbanTask>>;
  updateTask: (input: UpdateTaskInput) => Promise<KanbanActionResult<KanbanTask>>;
  deleteTask: (input: DeleteTaskInput) => Promise<KanbanActionResult<null>>;
  moveTask: (input: MoveTaskInput) => Promise<KanbanActionResult<null>>;
  assignTaskMembers: (input: AssignTaskMembersInput) => Promise<KanbanActionResult<null>>;
  removeTaskMember: (input: RemoveTaskMemberInput) => Promise<KanbanActionResult<null>>;
}

export interface UseKanbanStateResult {
  board: KanbanBoardSnapshot;
  error: string | null;
  isRefreshing: boolean;
  isMutating: boolean;
  actions: KanbanStateActions;
}

export function useKanbanState({ teamId, initialSnapshot, onError }: UseKanbanStateProps): UseKanbanStateResult {
  const [board, setBoard] = useState<KanbanBoardSnapshot>(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    setBoard(initialSnapshot);
  }, [initialSnapshot]);

  const handleError = useCallback(
    (message: string | undefined) => {
      if (!message) return;
      setError(message);
      onError?.(message);
    },
    [onError],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await getKanbanBoard(teamId);
      if (result.error || !result.data) {
        handleError(result.error ?? 'Kanban board verileri alınamadı.');
        return { error: result.error ?? 'Kanban board verileri alınamadı.' } as KanbanActionResult<KanbanBoardSnapshot>;
      }

      setBoard(result.data as KanbanBoardSnapshot);
      setError(null);
      return { data: result.data };
    } finally {
      setIsRefreshing(false);
    }
  }, [teamId, handleError]);

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`kanban_updates_${teamId}_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sprints', filter: `team_id=eq.${teamId}` },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, refresh]);

  const runAction = useCallback(
    async <T>(executor: () => Promise<KanbanActionResult<T>>) => {
      setIsMutating(true);
      setError(null);
      try {
        const result = await executor();
        if (result.error) {
          handleError(result.error);
          return result;
        }

        await refresh();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
        handleError(message);
        return { error: message } as KanbanActionResult<T>;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh, handleError],
  );

  const actions = useMemo<KanbanStateActions>(
    () => ({
      refresh,
      createSprint: input => runAction(() => createSprint(input)),
      updateSprint: input => runAction(() => updateSprint(input)),
      deleteSprint: input => runAction(() => deleteSprint(input)),
      reorderSprints: input => runAction(() => reorderSprints(input)),
      createTask: input => runAction(() => createTask(input)),
      updateTask: input => runAction(() => updateTask(input)),
      deleteTask: input => runAction(() => deleteTask(input)),
      moveTask: input => runAction(() => moveTask(input)),
      assignTaskMembers: input => runAction(() => assignTaskMembers(input)),
      removeTaskMember: input => runAction(() => removeTaskMember(input)),
    }),
    [refresh, runAction],
  );

  return {
    board,
    error,
    isRefreshing,
    isMutating,
    actions,
  };
}
