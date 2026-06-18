import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getPrompt() {
  const { data, error } = await supabase.from('clients').select('prompt, id, name').ilike('name', '%Trazzos%').single();
  if (error) {
    console.error("Error fetching client:", error);
    return;
  }
  fs.writeFileSync('trazzos_current_prompt.txt', data.prompt);
  console.log("Wrote prompt to trazzos_current_prompt.txt");
}
getPrompt();
