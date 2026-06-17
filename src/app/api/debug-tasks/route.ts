import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. Fetch with authenticated client
  const { data: authData, error: authError } = await supabase
    .from('tasks')
    .select(`
      id, title, status, team_id,
      task_members!inner(student_id),
      teams(name, course_id, course:course_id(code))
    `)
    .eq('task_members.student_id', user.id);

  // 2. Fetch with admin client
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: adminData, error: adminError } = await adminClient
    .from('tasks')
    .select(`
      id, title, status, team_id,
      task_members!inner(student_id),
      teams(name, course_id, course:course_id(code))
    `)
    .eq('task_members.student_id', user.id);

  return NextResponse.json({
    userId: user.id,
    authClient: { data: authData, error: authError },
    adminClient: { data: adminData, error: adminError }
  });
}
