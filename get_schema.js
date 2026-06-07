/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN (\'courses\', \'course_enrollments\');' });
  if (error) {
    // If rpc fails, we can query REST API if exposed, but let's try another way
    console.log("RPC Error:", error);
  } else {
    console.log("Schema:", data);
  }
}
checkSchema();
