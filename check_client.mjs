import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClients() {
    console.log('--- Checking Clients Table ---');
    const { data: clients, error } = await supabase.from('clients')
        .select('id, name, phone_number_id')
        .eq('phone_number_id', '1033194656544690');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Naturel Client found:', clients);
    }
}

checkClients();
