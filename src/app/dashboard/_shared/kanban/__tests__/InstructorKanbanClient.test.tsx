import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InstructorKanbanClient } from '@/app/dashboard/_shared/kanban/InstructorKanbanClient';
import type { UseKanbanStateResult } from '@/app/dashboard/_shared/kanban/hooks/useKanbanState';
import type { KanbanBoardSnapshot } from '@/types/kanban';

const mockUseKanbanState = vi.fn();

vi.mock('@/app/dashboard/_shared/kanban/hooks/useKanbanState', () => ({
  useKanbanState: (...args: unknown[]) => mockUseKanbanState(...args),
}));

const baseBoard: KanbanBoardSnapshot = {
  teamId: 'team-1',
  courseId: 'course-1',
  canManage: true,
  sprints: [],
  backlogColumns: [],
  lastSyncedAt: '2024-01-01T00:00:00.000Z',
};

function buildState(overrides: Partial<UseKanbanStateResult> = {}): UseKanbanStateResult {
  return {
    board: baseBoard,
    error: null,
    isMutating: false,
    isRefreshing: false,
    actions: {
      refresh: vi.fn().mockResolvedValue({ data: baseBoard }),
      createSprint: vi.fn(),
      updateSprint: vi.fn(),
      reorderSprints: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      moveTask: vi.fn(),
      assignTaskMembers: vi.fn(),
      removeTaskMember: vi.fn(),
    },
    ...overrides,
  };
}

describe('InstructorKanbanClient', () => {
  beforeEach(() => {
    mockUseKanbanState.mockReset();
  });

  it('shows management actions when user can manage', () => {
    const state = buildState();
    mockUseKanbanState.mockReturnValue(state);

    render(
      <InstructorKanbanClient
        teamId="team-1"
        teamName="Takım Alfa"
        courseName="Yazılım Mühendisliği"
        initialSnapshot={baseBoard}
      />,
    );

    expect(screen.getByRole('button', { name: /Sprint Oluştur/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Görev Oluştur/i })).toBeInTheDocument();
  });

  it('hides management actions for read-only viewers and still allows refresh', async () => {
    const refresh = vi.fn().mockResolvedValue({ data: baseBoard });
    const state = buildState({
      board: { ...baseBoard, canManage: false },
      actions: { ...buildState().actions, refresh },
    });
    mockUseKanbanState.mockReturnValue(state);

    render(
      <InstructorKanbanClient
        teamId="team-1"
        teamName="Takım Beta"
        courseName="Yazılım Mühendisliği"
        initialSnapshot={{ ...baseBoard, canManage: false }}
      />,
    );

    expect(screen.queryByRole('button', { name: /Sprint Oluştur/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Görev Oluştur/i })).not.toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: /^Yenile$/i });
    await userEvent.click(refreshButton);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
