import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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
  console.log("Error:", error);
}
run();
