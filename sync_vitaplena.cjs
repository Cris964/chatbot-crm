require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const newPrompt = fs.readFileSync('activos_current_prompt.txt', 'utf8');
  
  // 1. Copy the Activos prompt to VitaPlena
  const { error: pErr } = await supabase
    .from('clients')
    .update({ prompt: newPrompt })
    .eq('id', 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a'); // VitaPlena
  if (pErr) console.error("Error updating prompt:", pErr);
  
  // 2. Archive all active conversations for VitaPlena to clear history
  const { error: cErr } = await supabase
    .from('conversations')
    .update({ archived: true })
    .eq('client_id', 'ece6d81d-3aa9-459c-9e23-83e5b5328d3a')
    .eq('archived', false);
  if (cErr) console.error("Error archiving conversations:", cErr);
  
  console.log("VitaPlena prompt updated and history cleared.");
}

main();
