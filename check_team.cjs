require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: team } = await supabase
    .from('team_members')
    .select('*');
    
  console.log("Team Members:");
  console.table(team);
}

main();
