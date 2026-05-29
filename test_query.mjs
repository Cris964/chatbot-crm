import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: tm } = await supabase.from('team_members').select('*');
    console.log('Team members:', tm);
    
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log('Users:', users.users.map(u => u.email));
}
check();
