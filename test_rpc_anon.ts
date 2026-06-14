import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Using ANON KEY
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase.rpc('check_domain_status', { p_domain: 'itu.edu.tr' });
  console.log('Anon RPC result:', data, error);
}
test();
