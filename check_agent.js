import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('conversations').select('messages').order('updated_at', { ascending: false }).limit(20);
    const agentImages = [];
    data.forEach(d => {
        d.messages?.forEach(m => {
            if (m.role === 'agent' && (m.type === 'image' || m.content?.includes('supabase.co'))) {
                agentImages.push(m);
            }
        });
    });
    console.log(JSON.stringify(agentImages, null, 2));
}

check();
