import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateClient() {
    const { data, error } = await supabase
        .from('clients')
        .update({ phone_number_id: '1074951269024593' })
        .eq('id', '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d');
    console.log("Updated Trazzos phone ID:", error || data);
}
updateClient();
