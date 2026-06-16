import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: clients } = await supabase.from('clients').select('id, name').ilike('name', '%Samaritana%').limit(1);
    if (!clients || clients.length === 0) return;
    
    const clientId = clients[0].id;
    const { data: conv } = await supabase
        .from('conversations')
        .select('messages, needs_human')
        .eq('client_id', clientId)
        .eq('user_phone', '573163799745')
        .single();
        
    console.log("Needs Human:", conv?.needs_human);
    if (conv && conv.messages) {
        console.log(JSON.stringify(conv.messages.slice(-5), null, 2));
    } else {
        console.log('No messages found');
    }
}

run();
