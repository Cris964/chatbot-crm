import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClientUsers() {
    console.log('--- Clients with User IDs ---');
    const { data: clients, error } = await supabase.from('clients')
        .select('id, name, user_id, phone_number_id');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        clients.forEach(c => {
            console.log(`- ${c.name} | ID: ${c.id} | User: ${c.user_id} | Phone: ${c.phone_number_id}`);
        });
    }
}

checkClientUsers();
