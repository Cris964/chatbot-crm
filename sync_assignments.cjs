require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Fetch all conversations that have an assigned_to value
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('user_phone, client_id, assigned_to')
    .not('assigned_to', 'is', null);
  
  if (error) return console.error(error);
  
  let updated = 0;
  for (const c of convs) {
    if (c.user_phone && c.client_id) {
      const { error: updateErr } = await supabase
        .from('leads')
        .update({ assigned_to: c.assigned_to })
        .eq('client_id', c.client_id)
        .eq('phone', c.user_phone);
        
      if (!updateErr) updated++;
    }
  }
  
  console.log(`Synced ${updated} leads based on conversation assignments!`);
}

main();
