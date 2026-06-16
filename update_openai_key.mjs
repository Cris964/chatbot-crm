import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Read local .env to get OPENAI_API_KEY
const localOpenAiKey = process.env.OPENAI_API_KEY;

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Setting OpenAI Key to:", localOpenAiKey.slice(0, 10) + "...");
  
  await supabase.from('clients').update({ openai_key: localOpenAiKey }).eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
  await supabase.from('clients').update({ openai_key: localOpenAiKey }).eq('id', '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d');
  
  console.log("Tokens updated in DB.");
}
check();
