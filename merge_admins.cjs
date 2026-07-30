require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const fakeAdminId = 'ab2e1621-556a-484e-879d-d7b64933b382';
  const realAdminId = 'b63e5f8d-aa8f-468c-8e3f-de833af151d6';
  
  // Migrate Leads
  const { data: leads, error: leadErr } = await supabase
    .from('leads')
    .update({ assigned_to: realAdminId })
    .eq('assigned_to', fakeAdminId);
  console.log('Leads migrated.');
    
  // Migrate Conversations
  const { data: convs, error: convErr } = await supabase
    .from('conversations')
    .update({ assigned_to: realAdminId })
    .eq('assigned_to', fakeAdminId);
  console.log('Conversations migrated.');

  // Delete fake admin from team_members
  const { error: delErr } = await supabase
    .from('team_members')
    .delete()
    .eq('user_id', fakeAdminId)
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468');
  console.log('Fake admin removed from team_members.');
}

main();
