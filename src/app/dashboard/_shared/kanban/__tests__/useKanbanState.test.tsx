import { act, renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useKanbanState } from '@/app/dashboard/_shared/kanban/hooks/useKanbanState';
import { createSprint, getKanbanBoard } from '@/app/dashboard/shared/kanban-actions';
import type { KanbanBoardSnapshot } from '@/types/kanban';

vi.mock('@/app/dashboard/shared/kanban-actions', () => ({
  getKanbanBoard: vi.fn(),
  createSprint: vi.fn(),
}));

const baseSnapshot: KanbanBoardSnapshot = {
  teamId: 'team-1',
  courseId: 'course-1',
  canManage: true,
  sprints: [],
  backlogColumns: [],
  lastSyncedAt: '2024-01-01T00:00:00.000Z',
};

const updatedSnapshot: KanbanBoardSnapshot = {
  ...baseSnapshot,
  lastSyncedAt: '2024-01-02T00:00:00.000Z',
  sprints: [
    {
      id: 'sprint-1',
      teamId: 'team-1',
      name: 'Sprint 1',
      status: 'active',
      startAt: '2024-01-01T00:00:00.000Z',
      endAt: '2024-01-14T23:59:59.000Z',
      position: 0,
      createdBy: 'instructor-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      columns: [],
    },
  ],
};

describe('useKanbanState', () => {
  const handleError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    handleError.mockReset();
  });

  it('refresh updates board data and clears previous errors', async () => {
    vi.mocked(getKanbanBoard).mockResolvedValueOnce({ data: updatedSnapshot });

    const { result } = renderHook(() =>
      useKanbanState({ teamId: baseSnapshot.teamId, initialSnapshot: baseSnapshot, onError: handleError }),
    );

    await act(async () => {
      const response = await result.current.actions.refresh();
      expect(response).toEqual({ data: updatedSnapshot });
    });

    await waitFor(() => {
      expect(result.current.board).toEqual(updatedSnapshot);
      expect(result.current.error).toBeNull();
    });

    expect(handleError).not.toHaveBeenCalled();
  });

  it('createSprint surfaces backend errors and skips refresh', async () => {
    vi.mocked(createSprint).mockResolvedValueOnce({ error: 'Sprint oluşturma yetkiniz yok.' });

    const { result } = renderHook(() =>
      useKanbanState({ teamId: baseSnapshot.teamId, initialSnapshot: baseSnapshot, onError: handleError }),
    );

    await act(async () => {
      const response = await result.current.actions.createSprint({
        teamId: baseSnapshot.teamId,
        name: 'Yeni Sprint',
        startAt: '2024-03-01T00:00:00.000Z',
        endAt: '2024-03-14T23:59:59.000Z',
      });

      expect(response).toEqual({ error: 'Sprint oluşturma yetkiniz yok.' });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Sprint oluşturma yetkiniz yok.');
    });

    expect(handleError).toHaveBeenCalledWith('Sprint oluşturma yetkiniz yok.');
    expect(vi.mocked(getKanbanBoard)).not.toHaveBeenCalled();
  });
});
