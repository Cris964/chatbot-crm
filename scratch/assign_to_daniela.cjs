const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Assigning to Daniela...');
  
  const { error: convErr } = await supabase
    .from('conversations')
    .update({ assigned_to: '2fcab0de-af97-446d-a217-bc986897cb3d' })
    .eq('client_id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');

  if (convErr) console.error("Error updating conversations:", convErr);
  else console.log("Conversations assigned successfully.");

  const { error: leadsErr } = await supabase
    .from('leads')
    .update({ assigned_to: '2fcab0de-af97-446d-a217-bc986897cb3d' })
    .eq('client_id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
    
  if (leadsErr) console.error("Error updating leads:", leadsErr);
  else console.log("Leads assigned successfully.");

  console.log('Done!');
}

run();
