import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.storage.getBucket('whatsapp_media');
    console.log(data ? `Bucket is public: ${data.public}` : 'Bucket not found');
}
check();
