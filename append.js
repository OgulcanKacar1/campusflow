const fs = require('fs');
const path = './src/app/dashboard/shared/kanban-actions.ts';
const content = `
function detectAttachmentType(url: string): 'drive' | 'figma' | 'github' | 'link' {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) return 'drive';
  if (lowerUrl.includes('figma.com')) return 'figma';
  if (lowerUrl.includes('github.com')) return 'github';
  return 'link';
}

export async function addTaskAttachment(input: AddTaskAttachmentInput): Promise<KanbanActionResult<null>> {
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
  const newAttachment: TaskAttachment = {
    id: crypto.randomUUID(),
    url: input.url,
    type: detectAttachmentType(input.url),
    title: input.url,
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
  return { data: null };
}

export async function removeTaskAttachment(input: RemoveTaskAttachmentInput): Promise<KanbanActionResult<null>> {
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
  return { data: null };
}
`;
fs.appendFileSync(path, content);
console.log('Appended successfully');
