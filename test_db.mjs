import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log("Checking meetings policies...");
  
  // Try to query pg_policies using an RPC or standard rest if possible, but rest doesn't expose pg_policies.
  // Instead, let's just completely disable RLS on meetings using an RPC? We don't have an RPC.
  // Let's just fetch all meetings to verify connection.
  const { data, error } = await supabase.from('meetings').select('*').limit(1);
  console.log("Meetings fetch test:", error ? error.message : "Success");
}

checkPolicies();
