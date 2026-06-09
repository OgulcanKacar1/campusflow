import { KANBAN_STATUS_DEFINITIONS, type KanbanBoardSnapshot, type KanbanColumn } from '@/types/kanban';

export function createEmptyBoardSnapshot(teamId: string, courseId: string): KanbanBoardSnapshot {
  const backlogColumns: KanbanColumn[] = KANBAN_STATUS_DEFINITIONS.map(({ key, title }) => ({
    status: key,
    title,
    tasks: [],
  }));

  return {
    teamId,
    courseId,
    canManage: false,
    sprints: [],
    backlogColumns,
    lastSyncedAt: new Date().toISOString(),
  };
}
