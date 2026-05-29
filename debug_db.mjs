import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: convs } = await supabase.from('conversations').select('*').limit(1);
    console.log("Conversations columns:", Object.keys(convs?.[0] || {}));
    
    const { data: tm } = await supabase.from('team_members').select('*, clients(*)').limit(1);
    console.log("Team member with client join:", tm?.[0]);
}
check();
