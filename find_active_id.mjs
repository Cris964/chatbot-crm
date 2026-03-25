import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function findActiveClientId() {
    console.log('--- Finding Active Client ID from Conversations ---');
    // Probamos obtener todas las conversaciones para ver qué IDs hay
    const { data: convs, error } = await supabase.from('conversations')
        .select('client_id, user_phone, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Recent Client IDs in Convs:', [...new Set(convs.map(c => c.client_id))]);
        convs.forEach(c => {
           console.log(`Phone: ${c.user_phone} | ClientID: ${c.client_id} | Date: ${c.updated_at}`);
        });
    }
}

findActiveClientId();
