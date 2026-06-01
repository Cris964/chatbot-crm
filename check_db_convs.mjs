import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: convs, error } = await supabase.from('conversations').select('*').limit(2).order('updated_at', { ascending: false });
  console.log("Convs:", JSON.stringify(convs, null, 2));
}
run();
