import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClientByEmail() {
    console.log('--- Checking Client by Email ---');
    const email = 'admin@chekadmin.com';
    const { data: clients, error } = await supabase.from('clients')
        .select('*')
        .eq('email', email);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Found clients:', clients);
    }
}

checkClientByEmail();
