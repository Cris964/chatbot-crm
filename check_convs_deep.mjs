import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkConvs() {
    console.log('--- Checking Recent Conversations ---');
    const { data, error } = await supabase.from('conversations')
        .select('id, user_phone, messages, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Latest Conv:', JSON.stringify(data[0], null, 2));
    }
}

checkConvs();
