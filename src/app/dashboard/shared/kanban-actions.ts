'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const getAdminClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import {
  KANBAN_STATUS_DEFINITIONS,
  normalizeSprintStatus,
  normalizeTaskPriority,
  normalizeTaskStatus,
  type AssignTaskMembersInput,
  type CreateSprintInput,
  type CreateTaskInput,
  type DeleteSprintInput,
  type DeleteTaskInput,
  type AddTaskAttachmentInput,
  type RemoveTaskAttachmentInput,
  type TaskAttachment,
  type KanbanActionResult,
  type KanbanBoardSnapshot,
  type KanbanColumn,
  type KanbanSprint,
  type KanbanTask,
  type KanbanTaskAssignment,
  type MoveTaskInput,
  type MutationOptions,
  type ReorderSprintsInput,
  type RemoveTaskMemberInput,
  type TaskPriority,
  type TaskStatus,
  type UpdateSprintInput,
  type UpdateTaskInput,
} from '@/types/kanban';
import { createNotification } from './notification-actions';
import { sendEmail } from '@/lib/mail';

interface ProfileRow {
  id: string;
  role: 'super_admin' | 'admin' | 'instructor' | 'student';
  organization_id: string | null;
}

interface TeamMembershipRow {
  student_id: string;
  role: 'member' | 'leader' | 'owner';
  left_at: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  project_name?: string | null;
  project_description?: string | null;
  course_id: string;
  course: {
    id: string;
    code: string;
    name: string;
    instructor_id: string;
    organization_id: string | null;
    sprint_mode: 'team' | 'instructor';
  } | null;
  team_members: TeamMembershipRow[] | null;
}

interface SprintRow {
  id: string;
  team_id: string;
  name: string;
  status: string;
  start_at: string;
  end_at: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  team_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  developer_note?: string | null;
  status: string;
  priority: string;
  position: number;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  short_id?: string | null;
  attachments?: any;
}

type ProfileRelation =
  | { full_name: string | null; email: string | null }
  | Array<{ full_name: string | null; email: string | null }>
  | null;

interface TaskMemberRow {
  task_id: string;
  student_id: string;
  profile: ProfileRelation;
}

interface TeamAccessContext {
  supabase: SupabaseClient;
  profile: ProfileRow;
  team: TeamRow;
  activeMembership: TeamMembershipRow | null;
  isInstructor: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  isLeader: boolean;
  canManageTasks: boolean;
  canManageSprints: boolean;
  canMoveTasks: boolean;
  sprintMode: 'instructor' | 'team';
  userId: string;
}

function buildError(error: string, code: KanbanActionResult<unknown>['code']): KanbanActionResult<never> {
  return { error, code };
}

function buildColumns(tasks: KanbanTask[]): KanbanColumn[] {
  return KANBAN_STATUS_DEFINITIONS.map(({ key, title }) => ({
    status: key,
    title,
    tasks: tasks
      .filter(task => task.status === key)
      .sort((a, b) => a.position - b.position),
  }));
}

function mapTask(row: TaskRow, assignments: KanbanTaskAssignment[]): KanbanTask {
  return {
    id: row.id,
    teamId: row.team_id,
    sprintId: row.sprint_id,
    title: row.title,
    short_id: row.short_id ?? null,
    description: row.description,
    developerNote: row.developer_note ?? null,
    status: normalizeTaskStatus(row.status),
    priority: normalizeTaskPriority(row.priority),
    position: row.position ?? 0,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignments,
    attachments: row.attachments || [],
  };
}

function mapSprint(row: SprintRow, tasks: KanbanTask[], hasAiReport: boolean = false): KanbanSprint {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    status: normalizeSprintStatus(row.status),
    startAt: row.start_at,
    endAt: row.end_at,
    position: row.position ?? 0,
    hasAiReport,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    columns: buildColumns(tasks),
  };
}

async function resolveTeamAccess(teamId: string): Promise<{ context?: TeamAccessContext; error?: KanbanActionResult<never> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: buildError('Oturum bulunamadı.', 'NOT_AUTHENTICATED') };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (profileError || !profile) {
    return { error: buildError('Profil bilgileri alınamadı.', 'SUPABASE_ERROR') };
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(
      `id, name, project_name, project_description, course_id,
       course:course_id ( id, code, name, instructor_id, organization_id, sprint_mode ),
       team_members ( student_id, role, left_at )`
    )
    .eq('id', teamId)
    .single<TeamRow>();

  if (teamError || !team) {
    return { error: buildError('Takım bulunamadı.', 'NOT_FOUND') };
  }

  const course = team.course;
  if (!course) {
    return { error: buildError('Takımın ders bilgisi bulunamadı.', 'SUPABASE_ERROR') };
  }

  const memberships = (team.team_members ?? []) as TeamMembershipRow[];
  const activeMembership = memberships.find(member => member.student_id === user.id && member.left_at === null) ?? null;
  const isInstructor = course.instructor_id === user.id;
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
  const isTeamMember = Boolean(activeMembership);
  const isLeader = Boolean(activeMembership && ['leader', 'owner'].includes(activeMembership.role));
  const sprintMode = course.sprint_mode ?? 'team';

  const canManageSprints = isInstructor || isAdmin || (isLeader && sprintMode === 'team');
  const canManageTasks = isInstructor || isAdmin || isTeamMember;
  const canMoveTasks = isInstructor || isAdmin || isTeamMember;

  const sameOrganization =
    profile.role === 'super_admin' ||
    !course.organization_id ||
    profile.organization_id === course.organization_id;

  if (!sameOrganization && !isAdmin && !isInstructor) {
    return { error: buildError('Bu takıma erişiminiz yok.', 'NOT_AUTHORIZED') };
  }

  // Öğrenci ise ve bu takımın üyesi değilse panoya erişemez
  if (!isAdmin && !isInstructor && !isTeamMember) {
    return { error: buildError('Bu takımın görev panosuna erişim yetkiniz yok.', 'NOT_AUTHORIZED') };
  }

  return {
    context: {
      supabase,
      profile,
      team,
      activeMembership,
      isInstructor,
      isAdmin,
      isTeamMember,
      isLeader,
      canManageTasks,
      canManageSprints,
      canMoveTasks,
      sprintMode,
      userId: user.id,
    },
  };
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.filter(Boolean)));
}

function defaultRevalidatePaths(courseId: string, teamId: string): string[] {
  return [
    `/dashboard/instructor/courses/${courseId}/teams/${teamId}`,
    `/dashboard/student/courses/${courseId}/team`,
  ];
}

async function revalidateKanban(options: MutationOptions | undefined, courseId: string, teamId: string) {
  const paths = uniquePaths([
    ...defaultRevalidatePaths(courseId, teamId),
    ...(options?.revalidatePaths ?? []),
  ]);

  await Promise.all(paths.map(path => revalidatePath(path)));
}

function pickProfile(relation: ProfileRelation): { full_name: string | null; email: string | null } | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation;
}

function groupAssignments(rows: TaskMemberRow[]): Map<string, KanbanTaskAssignment[]> {
  const map = new Map<string, KanbanTaskAssignment[]>();

  rows.forEach(row => {
    const assignments = map.get(row.task_id) ?? [];
    const profile = pickProfile(row.profile);
    assignments.push({
      taskId: row.task_id,
      studentId: row.student_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    });
    map.set(row.task_id, assignments);
  });

  return map;
}

async function fetchBoardData(context: TeamAccessContext): Promise<KanbanActionResult<KanbanBoardSnapshot>> {
  const { team } = context;
  const supabaseAdmin = getAdminClient();

  const { data: sprintRows, error: sprintError } = await supabaseAdmin
    .from('sprints')
    .select('id, team_id, name, status, start_at, end_at, position, created_by, created_at, updated_at')
    .eq('team_id', team.id)
    .order('position', { ascending: true });

  if (sprintError) {
    return buildError('Sprint verileri alınamadı.', 'SUPABASE_ERROR');
  }

  const { data: taskRows, error: taskError } = await supabaseAdmin
    .from('tasks')
    .select('id, team_id, sprint_id, title, short_id, description, developer_note, status, priority, position, assigned_to, created_by, created_at, updated_at, attachments')
    .eq('team_id', team.id)
    .order('position', { ascending: true });

  if (taskError) {
    return buildError('Görev verileri alınamadı.', 'SUPABASE_ERROR');
  }

  const tasksList = (taskRows ?? []) as TaskRow[];
  const taskIds = tasksList.map(task => task.id);

  let assignmentMap = new Map<string, KanbanTaskAssignment[]>();
  if (taskIds.length > 0) {
    const { data: assignmentRows, error: assignmentError } = await supabaseAdmin
      .from('task_members')
      .select('task_id, student_id, profile:student_id ( full_name, email )')
      .in('task_id', taskIds);

    if (assignmentError) {
      console.error('Task members fetch error:', assignmentError);
      return buildError(`Görev üyeleri alınamadı: ${assignmentError.message || JSON.stringify(assignmentError)}`, 'SUPABASE_ERROR');
    }

    assignmentMap = groupAssignments((assignmentRows ?? []) as TaskMemberRow[]);
  }

  const tasks = tasksList.map(row => mapTask(row, assignmentMap.get(row.id) ?? []));
  const sprintList = (sprintRows ?? []) as SprintRow[];

  const { data: reportsData } = await supabaseAdmin
    .from('ai_sprint_reports')
    .select('sprint_id')
    .eq('team_id', team.id);
  
  const reportedSprintIds = new Set((reportsData || []).map(r => r.sprint_id));

  const sprints = sprintList.map(sprint => {
    const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
    return mapSprint(sprint, sprintTasks, reportedSprintIds.has(sprint.id));
  });

  const backlogTasks = tasks.filter(task => task.sprintId === null);
  const backlogColumns = buildColumns(backlogTasks);

  const { data: teamMembersData } = await supabaseAdmin
    .from('team_members')
    .select('student_id, profile:student_id ( full_name, email )')
    .eq('team_id', team.id)
    .is('left_at', null);

  const teamMembers = ((teamMembersData ?? []) as any[]).map(row => {
    const profile = pickProfile(row.profile as ProfileRelation);
    return {
      studentId: row.student_id as string,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });

  return {
    data: {
      teamId: team.id,
      courseId: team.course_id,
      projectName: team.project_name ?? null,
      projectDescription: team.project_description ?? null,
      canManageTasks: context.canManageTasks,
      canManageSprints: context.canManageSprints,
      canMoveTasks: context.canMoveTasks,
      isInstructor: context.isInstructor,
      isLeader: context.isLeader,
      sprintMode: context.sprintMode,
      sprints,
      backlogColumns,
      teamMembers,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

async function nextSprintPosition(supabase: SupabaseClient, teamId: string): Promise<number> {
  const { data, error } = await supabase
    .from('sprints')
    .select('position')
    .eq('team_id', teamId)
    .order('position', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const current = data?.[0]?.position ?? -1;
  return current + 1;
}

async function nextTaskPosition(
  supabase: SupabaseClient,
  teamId: string,
  sprintId: string | null,
  status: TaskStatus,
): Promise<number> {
  const query = supabase
    .from('tasks')
    .select('position')
    .eq('team_id', teamId)
    .eq('status', status)
    .order('position', { ascending: false })
    .limit(1);

  if (sprintId === null) {
    query.is('sprint_id', null);
  } else {
    query.eq('sprint_id', sprintId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const current = data?.[0]?.position ?? -1;
  return current + 1;
}

async function normalizeLanePositions(
  supabase: SupabaseClient,
  teamId: string,
  sprintId: string | null,
  status: TaskStatus,
) {
  const query = supabase
    .from('tasks')
    .select('id, position')
    .eq('team_id', teamId)
    .eq('status', status)
    .order('position', { ascending: true });

  if (sprintId === null) {
    query.is('sprint_id', null);
  } else {
    query.eq('sprint_id', sprintId);
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? 'Görev pozisyonları alınamadı.');
  }

  await Promise.all(
    data.map((row, index) => {
      if (row.position === index) return Promise.resolve();
      return supabase
        .from('tasks')
        .update({ position: index })
        .eq('id', row.id)
        .eq('team_id', teamId);
    }),
  );
}

function validateDateOrder(startAt: string, endAt: string): boolean {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && start <= end;
}

export async function getKanbanBoard(teamId: string): Promise<KanbanActionResult<KanbanBoardSnapshot>> {
  const resolved = await resolveTeamAccess(teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  return fetchBoardData(context);
}

export async function createSprint(input: CreateSprintInput): Promise<KanbanActionResult<KanbanSprint>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageSprints) {
    return buildError('Sprint oluşturma yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  if (!input.name?.trim()) {
    return buildError('Sprint adı gereklidir.', 'VALIDATION_ERROR');
  }

  if (!validateDateOrder(input.startAt, input.endAt)) {
    return buildError('Sprint başlangıç ve bitiş tarihleri geçerli değil.', 'VALIDATION_ERROR');
  }

  if (input.status === 'active') {
    const { count } = await context.supabase
      .from('sprints')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', input.teamId)
      .eq('status', 'active');
      
    if (count && count > 0) {
      return buildError('Zaten aktif bir sprintiniz var. Lütfen önce aktif sprinti tamamlayın.', 'VALIDATION_ERROR');
    }
  }

  let position = input.position ?? 0;
  if (input.position === undefined) {
    try {
      position = await nextSprintPosition(context.supabase, input.teamId);
    } catch {
      return buildError('Sprint sırası hesaplanamadı.', 'SUPABASE_ERROR');
    }
  }

  const payload = {
    team_id: input.teamId,
    name: input.name.trim(),
    start_at: input.startAt,
    end_at: input.endAt,
    status: input.status ?? 'planning',
    position,
    created_by: context.userId,
  };

  const { data, error } = await context.supabase
    .from('sprints')
    .insert(payload)
    .select('id, team_id, name, status, start_at, end_at, position, created_by, created_at, updated_at')
    .single<SprintRow>();

  if (error || !data) {
    return buildError('Sprint oluşturulamadı.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: mapSprint(data, []) };
}

export async function updateSprint(input: UpdateSprintInput): Promise<KanbanActionResult<KanbanSprint>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageSprints) {
    return buildError('Sprint güncelleme yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const updatePayload: Record<string, unknown> = {};
  if (input.name !== undefined) updatePayload.name = input.name.trim();
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.startAt !== undefined) updatePayload.start_at = input.startAt;
  if (input.endAt !== undefined) updatePayload.end_at = input.endAt;
  if (input.position !== undefined) updatePayload.position = input.position;

  if (input.status === 'active') {
    const { count } = await context.supabase
      .from('sprints')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', input.teamId)
      .eq('status', 'active')
      .neq('id', input.sprintId);
      
    if (count && count > 0) {
      return buildError('Zaten aktif bir sprintiniz var. Lütfen önce aktif sprinti tamamlayın.', 'VALIDATION_ERROR');
    }
  }

  if (updatePayload.start_at && updatePayload.end_at) {
    if (!validateDateOrder(updatePayload.start_at as string, updatePayload.end_at as string)) {
      return buildError('Sprint tarihleri geçerli değil.', 'VALIDATION_ERROR');
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return buildError('Güncellenecek alan bulunamadı.', 'VALIDATION_ERROR');
  }

  const { data, error } = await context.supabase
    .from('sprints')
    .update(updatePayload)
    .eq('id', input.sprintId)
    .eq('team_id', input.teamId)
    .select('id, team_id, name, status, start_at, end_at, position, created_by, created_at, updated_at')
    .single<SprintRow>();

  if (error || !data) {
    return buildError('Sprint güncellenemedi.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: mapSprint(data, []) };
}

export async function reorderSprints(input: ReorderSprintsInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageSprints) {
    return buildError('Sprint sıralama yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  try {
    for (const order of input.orders) {
      const { error } = await context.supabase
        .from('sprints')
        .update({ position: order.position })
        .eq('id', order.sprintId)
        .eq('team_id', input.teamId);

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch {
    return buildError('Sprint sıralaması güncellenemedi.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

export async function createTask(input: CreateTaskInput): Promise<KanbanActionResult<KanbanTask>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageTasks) {
    return buildError('Görev oluşturma yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  if (!input.title?.trim()) {
    return buildError('Görev başlığı gereklidir.', 'VALIDATION_ERROR');
  }

  const status: TaskStatus = input.status ? normalizeTaskStatus(input.status) : 'todo';
  const priority: TaskPriority = input.priority ? normalizeTaskPriority(input.priority) : 'medium';

  let position = input.position ?? 0;
  if (input.position === undefined) {
    try {
      position = await nextTaskPosition(context.supabase, input.teamId, input.sprintId ?? null, status);
    } catch {
      return buildError('Görev sırası hesaplanamadı.', 'SUPABASE_ERROR');
    }
  }

  const payload = {
    team_id: input.teamId,
    sprint_id: input.sprintId ?? null,
    title: input.title.trim(),
    description: input.description ?? null,
    developer_note: input.developerNote ?? null,
    status,
    priority,
    position,
    assigned_to: input.assignedTo ?? null,
    created_by: context.userId,
  };

  const { data, error } = await context.supabase
    .from('tasks')
    .insert(payload)
    .select('id, team_id, sprint_id, title, description, developer_note, status, priority, position, assigned_to, created_by, created_at, updated_at')
    .single<TaskRow>();

  if (error || !data) {
    return buildError('Görev oluşturulamadı.', 'SUPABASE_ERROR');
  }

  let finalAssignments: KanbanTaskAssignment[] = [];
  if (input.assignees && input.assignees.length > 0) {
    const rows = input.assignees.map(studentId => ({
      task_id: data.id,
      student_id: studentId,
    }));
    const supabaseAdmin = getAdminClient();
    const { error: upsertError } = await supabaseAdmin.from('task_members').upsert(rows);
    if (upsertError) {
      console.error('Task assignees upsert error:', upsertError);
    }
    // Hızlı dönüş için assignees objesini oluştur, tam profil detayı revalidate ile gelecek
    finalAssignments = input.assignees.map(id => ({ taskId: data.id, studentId: id }));

    // Belirli atanan kişilere bildirim ve e-posta gönder (paralel)
    const contextTitle = `[${context.team.course?.code || 'Ders'} - ${context.team.name}]`;
    const notifyPromises = input.assignees
      .filter(studentId => studentId !== context.userId)
      .map(async (studentId) => {
        await createNotification({
          userId: studentId,
          title: 'Yeni Görev Atandı',
          content: `${contextTitle} '${data.title}' adlı görev size atandı.`,
          type: 'task_assigned',
          entityType: 'task',
          entityId: data.id,
        });

        const { data: profile } = await context.supabase.from('profiles').select('email, full_name').eq('id', studentId).maybeSingle();
        if (profile && profile.email) {
          await sendEmail({
            to: profile.email,
            subject: `CampusFlow - Yeni Görev Ataması: ${contextTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Yeni Görev Atandı</h2>
                <p>Merhaba <b>${profile.full_name || 'Öğrenci'}</b>,</p>
                <p>Sana yeni bir görev atandı:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><b>Görev Başlığı:</b> ${data.title}</p>
                  <p><b>Öncelik:</b> ${data.priority}</p>
                </div>
                <p>CampusFlow panosuna giderek göreve başlayabilirsin.</p>
              </div>
            `
          });
        }
      });
    await Promise.all(notifyPromises);
  } else {
    // Sadece takıma "yeni görev eklendi" bildirimi gönder (e-posta yok)
    const members = context.team.team_members?.filter(m => m.left_at === null && m.student_id !== context.userId) || [];
    const sysPromises = members.map(m => createNotification({
      userId: m.student_id,
      title: 'Yeni Görev Eklendi',
      content: `'${data.title}' adlı yeni bir görev oluşturuldu.`,
      type: 'system',
      entityType: 'task',
      entityId: data.id,
    }));
    await Promise.all(sysPromises);
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: mapTask(data, finalAssignments) };
}

export async function updateTask(input: UpdateTaskInput): Promise<KanbanActionResult<KanbanTask>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageTasks) {
    return buildError('Görev güncelleme yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const updatePayload: Record<string, unknown> = {};
  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.developerNote !== undefined) updatePayload.developer_note = input.developerNote;
  if (input.status !== undefined) updatePayload.status = normalizeTaskStatus(input.status);
  if (input.priority !== undefined) updatePayload.priority = normalizeTaskPriority(input.priority);
  if (input.sprintId !== undefined) updatePayload.sprint_id = input.sprintId;
  if (input.assignedTo !== undefined) updatePayload.assigned_to = input.assignedTo;
  if (input.position !== undefined) updatePayload.position = input.position;

  if (Object.keys(updatePayload).length === 0 && input.assignees === undefined) {
    return buildError('Güncellenecek alan bulunamadı.', 'VALIDATION_ERROR');
  }

  let data = null;
  if (Object.keys(updatePayload).length > 0) {
    const { data: updateData, error } = await context.supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', input.taskId)
      .eq('team_id', input.teamId)
      .select('id, team_id, sprint_id, title, description, developer_note, status, priority, position, assigned_to, created_by, created_at, updated_at')
      .single<TaskRow>();

    if (error || !updateData) {
      return buildError('Görev güncellenemedi.', 'SUPABASE_ERROR');
    }
    data = updateData;
  } else {
    // Sadece assignee güncelleniyorsa, mevcut görevi getir
    const { data: existingData } = await context.supabase
      .from('tasks')
      .select('id, team_id, sprint_id, title, description, developer_note, status, priority, position, assigned_to, created_by, created_at, updated_at')
      .eq('id', input.taskId)
      .single<TaskRow>();
    data = existingData;
  }

  if (input.assignees !== undefined) {
    const supabaseAdmin = getAdminClient();
    
    // Mevcut atananları bul ki sadece "yeni" eklenenlere mail atalım
    const { data: existingMembers } = await context.supabase
      .from('task_members')
      .select('student_id')
      .eq('task_id', input.taskId);
    const existingIds = new Set(existingMembers?.map(m => m.student_id) || []);

    await supabaseAdmin.from('task_members').delete().eq('task_id', input.taskId);
    
    if (input.assignees.length > 0) {
      const rows = input.assignees.map(studentId => ({
        task_id: input.taskId,
        student_id: studentId,
      }));
      await supabaseAdmin.from('task_members').insert(rows);
    }

    // Sadece "yeni" eklenen üyelere mail ve bildirim gönder
    const newlyAdded = input.assignees.filter(id => !existingIds.has(id) && id !== context.userId);
    if (newlyAdded.length > 0) {
      const contextTitle = `[${context.team.course?.code || 'Ders'} - ${context.team.name}]`;
      const notifyPromises = newlyAdded.map(async (studentId) => {
        await createNotification({
          userId: studentId,
          title: 'Görev Size Atandı',
          content: `${contextTitle} '${data?.title || 'Bilinmeyen Görev'}' adlı görev size atandı.`,
          type: 'task_assigned',
          entityType: 'task',
          entityId: input.taskId,
        });

        const { data: profile } = await context.supabase.from('profiles').select('email, full_name').eq('id', studentId).maybeSingle();
        if (profile && profile.email) {
          await sendEmail({
            to: profile.email,
            subject: `CampusFlow - Görev Ataması: ${contextTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Görev Ataması</h2>
                <p>Merhaba <b>${profile.full_name || 'Öğrenci'}</b>,</p>
                <p>Seni mevcut bir göreve atadılar:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><b>Görev Başlığı:</b> ${data?.title}</p>
                </div>
                <p>Panoyu kontrol edebilirsin.</p>
              </div>
            `
          });
        }
      });
      await Promise.all(notifyPromises);
    }
  }

  if (!data) {
    return buildError('Görev bulunamadı.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: mapTask(data, []) };
}

export async function moveTask(input: MoveTaskInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canMoveTasks) {
    return buildError('Görev taşıma yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const targetStatus = normalizeTaskStatus(input.targetStatus);

  const { data: currentTask, error: fetchError } = await context.supabase
    .from('tasks')
    .select('id, sprint_id, status, short_id, title')
    .eq('id', input.taskId)
    .eq('team_id', input.teamId)
    .single<{ id: string; sprint_id: string | null; status: string; short_id: string; title: string }>();

  if (fetchError || !currentTask) {
    return buildError('Görev bulunamadı.', 'NOT_FOUND');
  }

  const previousSprintId = currentTask.sprint_id;
  const previousStatus = normalizeTaskStatus(currentTask.status);

  const { error: updateError } = await context.supabase
    .from('tasks')
    .update({
      sprint_id: input.targetSprintId,
      status: targetStatus,
      position: input.targetPosition,
    })
    .eq('id', input.taskId)
    .eq('team_id', input.teamId);

  if (updateError) {
    return buildError('Görev taşınamadı.', 'SUPABASE_ERROR');
  }

  try {
    await normalizeLanePositions(context.supabase, input.teamId, input.targetSprintId, targetStatus);
    if (previousSprintId !== input.targetSprintId || previousStatus !== targetStatus) {
      await normalizeLanePositions(context.supabase, input.teamId, previousSprintId, previousStatus);
    }
  } catch {
    return buildError('Görev sıralaması normalize edilemedi.', 'SUPABASE_ERROR');
  }

  if (previousStatus !== targetStatus) {
    const members = context.team.team_members?.filter(m => m.left_at === null && m.student_id !== context.userId) || [];
    const contextTitle = `[${context.team.course?.code || 'Ders'} - ${context.team.name}]`;
    for (const m of members) {
      await createNotification({
        userId: m.student_id,
        title: 'Görev Durumu Güncellendi',
        content: `${contextTitle} '${currentTask.short_id} ${currentTask.title}' görevinin durumu '${targetStatus}' oldu.`,
        type: 'task_status',
        entityType: 'task',
        entityId: input.taskId,
      });
    }
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

export async function assignTaskMembers(input: AssignTaskMembersInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageTasks) {
    return buildError('Görev üye atama yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  if (!Array.isArray(input.studentIds) || input.studentIds.length === 0) {
    return buildError('En az bir öğrenci seçilmelidir.', 'VALIDATION_ERROR');
  }

  const rows = input.studentIds.map(studentId => ({
    task_id: input.taskId,
    student_id: studentId,
  }));

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from('task_members')
    .upsert(rows, { onConflict: 'task_id,student_id', ignoreDuplicates: true });

  if (error) {
    return buildError('Görev üyeleri atanamadı.', 'SUPABASE_ERROR');
  }

  const { data: taskData } = await context.supabase.from('tasks').select('title').eq('id', input.taskId).maybeSingle();
  const contextTitle = `[${context.team.course?.code || 'Ders'} - ${context.team.name}]`;
  const notifyPromises = input.studentIds
    .filter(studentId => studentId !== context.userId)
    .map(async (studentId) => {
      await createNotification({
        userId: studentId,
        title: 'Görev Size Atandı',
        content: `${contextTitle} '${taskData?.title || 'Bilinmeyen Görev'}' adlı görev size atandı.`,
        type: 'task_assigned',
        entityType: 'task',
        entityId: input.taskId,
      });

      const { data: profile } = await context.supabase.from('profiles').select('email, full_name').eq('id', studentId).maybeSingle();
      if (profile && profile.email) {
        await sendEmail({
          to: profile.email,
          subject: `CampusFlow - Görev Ataması: ${contextTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4f46e5;">Görev Ataması</h2>
              <p>Merhaba <b>${profile.full_name || 'Öğrenci'}</b>,</p>
              <p>Seni mevcut bir göreve atadılar:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><b>Görev Başlığı:</b> ${taskData?.title}</p>
              </div>
              <p>Panoyu kontrol edebilirsin.</p>
            </div>
          `
        });
      }
    });
  await Promise.all(notifyPromises);

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

export async function removeTaskMember(input: RemoveTaskMemberInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  const isSelfRemoval = input.studentId === context.userId;
  if (!isSelfRemoval && !context.canManageTasks) {
    return buildError('Görevden üye çıkarma yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const { error } = await context.supabase
    .from('task_members')
    .delete()
    .eq('task_id', input.taskId)
    .eq('student_id', input.studentId);

  if (error) {
    return buildError('Görev üyesi silinemedi.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

export async function deleteSprint(input: DeleteSprintInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageSprints) {
    return buildError('Sprint silme yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const moveToBacklog = input.moveTasksToBacklog !== false; // default true

  if (moveToBacklog) {
    // Sprint'teki görevleri backlog'a taşı (sprint_id = null)
    const { error: moveError } = await context.supabase
      .from('tasks')
      .update({ sprint_id: null })
      .eq('sprint_id', input.sprintId)
      .eq('team_id', input.teamId);

    if (moveError) {
      return buildError('Görevler backlog\'a taşınamadı.', 'SUPABASE_ERROR');
    }
  }

  const { error } = await context.supabase
    .from('sprints')
    .delete()
    .eq('id', input.sprintId)
    .eq('team_id', input.teamId);

  if (error) {
    return buildError('Sprint silinemedi.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

export async function deleteTask(input: DeleteTaskInput): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.canManageTasks) {
    return buildError('Görev silme yetkiniz yok.', 'NOT_AUTHORIZED');
  }

  const { error } = await context.supabase
    .from('tasks')
    .delete()
    .eq('id', input.taskId)
    .eq('team_id', input.teamId);

  if (error) {
    return buildError('Görev silinemedi.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: null };
}

function detectAttachmentType(url: string): 'drive' | 'figma' | 'github' | 'link' {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) return 'drive';
  if (lowerUrl.includes('figma.com')) return 'figma';
  if (lowerUrl.includes('github.com')) return 'github';
  return 'link';
}

export async function addTaskAttachment(input: AddTaskAttachmentInput): Promise<KanbanActionResult<TaskAttachment[]>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  const { data: task, error: fetchErr } = await context.supabase
    .from('tasks')
    .select('attachments')
    .eq('id', input.taskId)
    .single();
  
  if (fetchErr || !task) return buildError('Görev bulunamadı.', 'NOT_FOUND');

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const detectedType = detectAttachmentType(input.url);
  const defaultTitle = 
    detectedType === 'drive' ? 'Google Drive Bağlantısı' :
    detectedType === 'figma' ? 'Figma Tasarımı' :
    detectedType === 'github' ? 'GitHub Bağlantısı' : 'Dış Bağlantı';

  const newAttachment: TaskAttachment = {
    id: crypto.randomUUID(),
    url: input.url,
    type: detectedType,
    title: input.title?.trim() || defaultTitle,
    added_by: context.profile.id,
    added_at: new Date().toISOString()
  };

  attachments.push(newAttachment);

  const { error: updateErr } = await context.supabase
    .from('tasks')
    .update({ attachments })
    .eq('id', input.taskId);

  if (updateErr) return buildError('Eklenti kaydedilemedi.', 'SUPABASE_ERROR');

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: attachments };
}

export async function removeTaskAttachment(input: RemoveTaskAttachmentInput): Promise<KanbanActionResult<TaskAttachment[]>> {
  const resolved = await resolveTeamAccess(input.teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  const { data: task, error: fetchErr } = await context.supabase
    .from('tasks')
    .select('attachments')
    .eq('id', input.taskId)
    .single();
  
  if (fetchErr || !task) return buildError('Görev bulunamadı.', 'NOT_FOUND');

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const filtered = attachments.filter((a: any) => a.id !== input.attachmentId);

  const { error: updateErr } = await context.supabase
    .from('tasks')
    .update({ attachments: filtered })
    .eq('id', input.taskId);

  if (updateErr) return buildError('Eklenti silinemedi.', 'SUPABASE_ERROR');

  await revalidateKanban(input.options, context.team.course_id, input.teamId);
  return { data: filtered };
}

export async function updateCourseSprintMode(courseId: string, teamId: string, mode: 'instructor' | 'team'): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.isInstructor) {
    return buildError('Bu işlemi sadece eğitmen yapabilir.', 'NOT_AUTHORIZED');
  }

  const { error } = await context.supabase
    .from('courses')
    .update({ sprint_mode: mode })
    .eq('id', courseId);

  if (error) {
    return buildError('Sprint modu güncellenirken bir hata oluştu.', 'SUPABASE_ERROR');
  }

  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  revalidatePath(`/dashboard/student/courses/${courseId}`);
  return { data: null };
}

export async function updateTeamProjectDetails(teamId: string, projectName: string, projectDescription: string): Promise<KanbanActionResult<null>> {
  const resolved = await resolveTeamAccess(teamId);
  if (resolved.error) return resolved.error;
  const context = resolved.context!;

  if (!context.isInstructor && !context.isLeader) {
    return buildError('Bu işlemi sadece eğitmen veya takım lideri yapabilir.', 'NOT_AUTHORIZED');
  }

  const { error } = await context.supabase
    .from('teams')
    .update({ project_name: projectName, project_description: projectDescription })
    .eq('id', teamId);

  if (error) {
    return buildError('Proje detayları güncellenirken bir hata oluştu.', 'SUPABASE_ERROR');
  }

  await revalidateKanban(undefined, context.team.course_id, teamId);
  return { data: null };
}

