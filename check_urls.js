import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('conversations').select('messages').order('updated_at', { ascending: false }).limit(20);
    const broken = [];
    data.forEach(d => {
        d.messages?.forEach(m => {
            if (m.media_url || m.mediaType) broken.push(m);
        });
    });
    console.log(JSON.stringify(broken, null, 2));
}

check();
