import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('conversations').select('messages').order('updated_at', { ascending: false }).limit(20);
    let found = null;
    data.forEach(d => {
        d.messages?.forEach(m => {
            if (m.content && m.content.includes('1787592478525_image.png')) {
                found = m;
            }
        });
    });
    console.log(JSON.stringify(found, null, 2));
}

check();
