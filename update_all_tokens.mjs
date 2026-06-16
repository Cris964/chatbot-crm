import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const envToken = process.env.WHATSAPP_TOKEN;
  console.log("Setting ALL clients token to:", envToken);
  
  await supabase.from('clients').update({ whatsapp_token: envToken }).neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("All Tokens updated in DB.");
}
check();
