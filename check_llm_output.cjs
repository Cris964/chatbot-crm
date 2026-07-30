require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: convs } = await supabase
    .from('conversations')
    .select('messages')
    .eq('client_id', 'f920ca15-badb-4492-a344-e8d04f9f8c02') // La Samaritana
    .order('updated_at', { ascending: false })
    .limit(3);

  convs.forEach(c => {
    const aiMsgs = c.messages.filter(m => m.role === 'agent' || m.role === 'assistant');
    if (aiMsgs.length > 0) {
       console.log(aiMsgs[aiMsgs.length - 1].content);
       console.log('---------------------------');
    }
  });
}
main();
