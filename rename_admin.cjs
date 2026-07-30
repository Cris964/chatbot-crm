require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const adminUserId = 'b63e5f8d-aa8f-468c-8e3f-de833af151d6'; // demo@nexuscrm.com

  // Rename to "Admin de Trazzos"
  const { error } = await supabase
    .from('team_members')
    .update({ full_name: 'Admin de Trazzos' })
    .eq('user_id', adminUserId)
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
  if (error) console.error(error);
  else console.log('Renamed Admin successfully.');
}

main();
