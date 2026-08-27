import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: client } = await supabase.from('clients').select('id').ilike('name', '%trazzos%').single();
    const { data } = await supabase.from('conversations').select('messages').eq('client_id', client.id).ilike('messages::text', '%131053%').limit(5);
    
    if (data && data.length > 0) {
        data.forEach(d => {
            const msgs = d.messages;
            // find where the error is
            msgs.forEach((m, idx) => {
                if (m.content && m.content.includes('131053') && idx > 0) {
                    console.log('--- ERROR ---');
                    console.log('Failing message:', msgs[idx - 1].content);
                }
            });
        });
    }
}
check();
