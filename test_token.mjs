import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: clients } = await supabase.from('clients').select('*').ilike('name', '%Samaritana%').limit(1);
    if (!clients || clients.length === 0) return;
    
    const client = clients[0];
    console.log('Phone Number ID:', client.phone_number_id);
    console.log('Token:', client.whatsapp_token.substring(0, 20) + '...');
    
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${client.phone_number_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + client.whatsapp_token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: '573163799745', // Cristian's phone number
                    type: 'text',
                    text: { body: 'Mensaje de prueba para verificar token.' }
                })
            }
        );
        const data = await response.json();
        if (response.ok) {
            console.log('Success:', data);
        } else {
            console.error('Error from WhatsApp API:', data);
        }
    } catch (e) {
        console.error('Network Error:', e.message);
    }
}
run();
