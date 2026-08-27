import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('conversations').select('messages').ilike('messages::text', '%DIFUSION%').limit(1);
    if (data && data.length > 0) {
        console.log(JSON.stringify(data[0].messages.slice(-5), null, 2));
    }
}
check();
