import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check ALL conversations (no filter)
  const { data, error } = await supabase.from('conversations').select('id, client_id, user_phone, user_name').limit(20);
  console.log("Error:", error);
  console.log("Total convs:", data?.length);
  console.log("Convs:", data);
}
run();
