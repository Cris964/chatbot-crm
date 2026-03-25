import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkConversations() {
    console.log('--- Checking Conversations ---');
    const { data, error } = await supabase.from('conversations')
        .select('id, user_phone, user_name, client_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Recent Conversations:', data);
    }
}

checkConversations();
