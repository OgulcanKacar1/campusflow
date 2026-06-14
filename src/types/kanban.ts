// src/types/kanban.ts
// Faz 4 Sprint & Kanban modülü için ortak tipler ve yardımcılar

export const KANBAN_STATUS_DEFINITIONS = [
  { key: 'todo', title: 'Yapılacak' },
  { key: 'in_progress', title: 'Devam Ediyor' },
  { key: 'blocked', title: 'Bloke' },
  { key: 'review', title: 'İnceleme' },
  { key: 'done', title: 'Tamamlandı' },
] as const;

export type TaskStatus = (typeof KANBAN_STATUS_DEFINITIONS)[number]['key'];

export const KANBAN_STATUS_LABELS: Record<TaskStatus, string> = KANBAN_STATUS_DEFINITIONS.reduce(
  (acc, item) => ({ ...acc, [item.key]: item.title }),
  {} as Record<TaskStatus, string>,
);

export const KANBAN_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type TaskPriority = (typeof KANBAN_PRIORITIES)[number];

export const KANBAN_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const SPRINT_STATUS_OPTIONS = ['planning', 'active', 'completed', 'archived'] as const;
export type SprintStatus = (typeof SPRINT_STATUS_OPTIONS)[number];

export interface KanbanTaskAssignment {
  taskId: string;
  studentId: string;
  fullName?: string | null;
  email?: string | null;
}

export interface TaskAttachment {
  id: string;
  url: string;
  type: 'drive' | 'figma' | 'github' | 'link';
  title: string;
  added_by: string;
  added_at: string;
}

export interface KanbanTask {
  id: string;
  short_id?: string | null;
  teamId: string;
  sprintId: string | null;
  title: string;
  description?: string | null;
  developerNote?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assignedTo?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments: KanbanTaskAssignment[];
  attachments?: TaskAttachment[];
}

export interface KanbanColumn {
  status: TaskStatus;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanSprint {
  id: string;
  teamId: string;
  name: string;
  status: SprintStatus;
  startAt: string;
  endAt: string;
  position: number;
  hasAiReport?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  columns: KanbanColumn[];
}

export interface KanbanBoardSnapshot {
  teamId: string;
  courseId: string;
  projectName?: string | null;
  projectDescription?: string | null;
  canManageTasks: boolean;
  canManageSprints: boolean;
  canMoveTasks: boolean;
  isInstructor: boolean;
  isLeader: boolean;
  sprintMode: 'instructor' | 'team';
  sprints: KanbanSprint[];
  backlogColumns: KanbanColumn[];
  teamMembers: Array<{ studentId: string; fullName: string | null; email: string | null }>;
  lastSyncedAt: string;
}

export interface Meeting {
  id: string;
  course_id: string;
  team_id: string | null;
  sprint_id: string | null;
  title: string;
  description: string | null;
  meeting_link: string | null;
  meeting_notes: string | null;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
}

export type CalendarEventType = 'meeting' | 'sprint' | 'task';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: CalendarEventType;
  description?: string;
  link?: string;
  isCourseWide?: boolean;
  originalData?: any;
}

export interface AiSprintReportContent {
  summary: string;
  overallScore: number;
  studentContributions: Array<{
    studentId: string;
    fullName: string;
    contributionPercentage: number;
    completedTasks: number;
    linesOfCode: number;
    attachmentsAdded: number;
    feedback: string;
  }>;
  recommendations: string[];
}

export interface AiSprintReport {
  id: string;
  teamId: string;
  sprintId: string;
  reportContent: AiSprintReportContent;
  createdAt: string;
  updatedAt: string;
}

export type KanbanActionErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_AUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SUPABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface KanbanActionResult<T> {
  data?: T;
  error?: string;
  code?: KanbanActionErrorCode;
}

export interface MutationOptions {
  revalidatePaths?: string[];
}

export interface CreateSprintInput {
  teamId: string;
  name: string;
  startAt: string;
  endAt: string;
  status?: SprintStatus;
  position?: number;
  options?: MutationOptions;
}

export interface UpdateSprintInput {
  teamId: string;
  sprintId: string;
  name?: string;
  startAt?: string;
  endAt?: string;
  status?: SprintStatus;
  position?: number;
  options?: MutationOptions;
}

export interface ReorderSprintsInput {
  teamId: string;
  orders: Array<{ sprintId: string; position: number }>;
  options?: MutationOptions;
}

export interface DeleteSprintInput {
  teamId: string;
  sprintId: string;
  /** Sprint silinince içindeki görevler backlog'a düşer (true) veya görevler de silinir (false, default: true) */
  moveTasksToBacklog?: boolean;
  options?: MutationOptions;
}

export interface DeleteTaskInput {
  teamId: string;
  taskId: string;
  options?: MutationOptions;
}

export interface CreateTaskInput {
  teamId: string;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string | null;
  developerNote?: string | null;
  sprintId?: string | null;
  assignedTo?: string | null;
  assignees?: string[];
  position?: number;
  options?: MutationOptions;
}

export interface UpdateTaskInput {
  teamId: string;
  taskId: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string | null;
  developerNote?: string | null;
  sprintId?: string | null;
  assignedTo?: string | null;
  assignees?: string[];
  position?: number;
  options?: MutationOptions;
}

export interface MoveTaskInput {
  teamId: string;
  taskId: string;
  targetSprintId: string | null;
  targetStatus: TaskStatus;
  targetPosition: number;
  options?: MutationOptions;
}

export interface AssignTaskMembersInput {
  teamId: string;
  taskId: string;
  studentIds: string[];
  options?: MutationOptions;
}

export interface RemoveTaskMemberInput {
  teamId: string;
  taskId: string;
  studentId: string;
  options?: MutationOptions;
}

export interface AddTaskAttachmentInput {
  teamId: string;
  taskId: string;
  url: string;
  title?: string;
  options?: MutationOptions;
}

export interface RemoveTaskAttachmentInput {
  teamId: string;
  taskId: string;
  attachmentId: string;
  options?: MutationOptions;
}


const TASK_STATUS_SET = new Set<string>(KANBAN_STATUS_DEFINITIONS.map(item => item.key));
const SPRINT_STATUS_SET = new Set<string>(SPRINT_STATUS_OPTIONS);
const TASK_PRIORITY_SET = new Set<string>(KANBAN_PRIORITIES);

export function normalizeTaskStatus(status: string | null | undefined): TaskStatus {
  if (!status) return 'todo';
  const lower = status.toLowerCase();
  return TASK_STATUS_SET.has(lower) ? (lower as TaskStatus) : 'todo';
}

export function normalizeSprintStatus(status: string | null | undefined): SprintStatus {
  if (!status) return 'planning';
  const lower = status.toLowerCase();
  return SPRINT_STATUS_SET.has(lower) ? (lower as SprintStatus) : 'planning';
}

export function normalizeTaskPriority(priority: string | null | undefined): TaskPriority {
  if (!priority) return 'medium';
  const lower = priority.toLowerCase();
  return TASK_PRIORITY_SET.has(lower) ? (lower as TaskPriority) : 'medium';
}
