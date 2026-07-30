require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConvs() {
  const { data: convs } = await supabase
    .from('conversations')
    .select('user_name, user_phone, updated_at')
    .eq('client_id', 'f920ca15-badb-4492-a344-e8d04f9f8c02')
    .order('updated_at', { ascending: false })
    .limit(5);
    
  console.log(convs);
}
checkConvs();
