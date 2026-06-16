import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const newToken = 'EAAWr0cfZBOz8BRpvLxsJiYaTHIpkBZAR2WZCAoaZA8NGgYZC4I7sqxpsQ98JZByQZANHtjVyF8KFEHPZCw5loWUk7N8of2ztoMivb0VKNUbfMsEaIKwKlgF207dWEZCVz4d5e9pqYkOdfTiSxjRqy47LXA7Q6BPzZBNGPuzDxLcZCdpkujuYTLlvTwHrJGsc4m8oPH5QwZDZD';

async function run() {
    const { data: clients, error: fetchError } = await supabase.from('clients').select('id, name').ilike('name', '%Samaritana%').limit(1);
    
    if (fetchError) {
        console.error('Error fetching client:', fetchError);
        return;
    }

    if (!clients || clients.length === 0) {
        console.error('No se encontró el cliente Samaritana en la base de datos.');
        return;
    }
    
    const { error: updateError } = await supabase.from('clients').update({ whatsapp_token: newToken }).eq('id', clients[0].id);
    
    if (updateError) {
        console.error('Error updating token:', updateError);
    } else {
        console.log(`✅ Token de WhatsApp para ${clients[0].name} actualizado exitosamente.`);
    }
}
run();
