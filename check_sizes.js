import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.storage.from('whatsapp_media').list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
