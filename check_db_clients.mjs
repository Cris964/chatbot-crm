import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: clients } = await supabase.from('clients').select('*');
  console.log("Clients:", clients);
  
  const { data: users } = await supabase.from('team_members').select('*');
  console.log("Team members:", users);
}
run();
