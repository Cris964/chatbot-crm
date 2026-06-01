import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: clients } = await supabase.from('clients').select('id').limit(1);
  const clientId = clients[0].id;
  
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
