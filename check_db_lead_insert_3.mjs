import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const clientId = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';
  
  const { data, error } = await supabase.from('leads').insert([{
      client_id: clientId,
      phone: '111111111',
      name: 'Test',
      stage: 'Contactado',
      score: 10,
      source: 'WhatsApp',
      value: '$0'
  }]);
  console.log("Leads Insert Error:", error);
}
run();
