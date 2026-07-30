require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: team } = await supabase
    .from('team_members')
    .select('*')
    .eq('client_id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
  console.log("Current Team:");
  console.table(team);
}

main();
