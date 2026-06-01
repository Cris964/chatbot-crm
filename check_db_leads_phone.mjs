import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('*').eq('phone', '573160000001');
  console.log("Leads:", leads, "Error:", error);
}
run();
