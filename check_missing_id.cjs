require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('processed_messages').select('*').like('id', '%DEBUG%').order('created_at', { ascending: false }).limit(10);
  if (error) console.error(error);
  else console.log('Missing IDs:', JSON.stringify(data, null, 2));
}

main();
