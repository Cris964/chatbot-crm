require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMetaAuth() {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', 'f920ca15-badb-4492-a344-e8d04f9f8c02')
    .single();
    
  console.log(data);
}
checkMetaAuth();
