const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: task } = await supabase.from('tasks').select('*').eq('short_id', 'T-1').single();
  console.log("Task Status:", task ? task.status : 'not found');
  const { data: events } = await supabase.from('task_github_events').select('*');
  console.log("Events:", events);
}
run();
