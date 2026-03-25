import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClients() {
    console.log('--- Listing ALL Clients ---');
    const { data: clients, error } = await supabase.from('clients')
        .select('id, name, phone_number_id, email');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Clients:', clients);
    }
}

checkClients();
