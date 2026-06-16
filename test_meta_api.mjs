import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });
import { createClient } from '@supabase/supabase-js';

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: clientData } = await supabase.from('clients').select('phone_number_id, whatsapp_token').ilike('name', '%Vitaplena%').single();
    
    console.log("Phone ID:", clientData.phone_number_id);
    console.log("Token:", clientData.whatsapp_token.substring(0,10));
    
    const res = await fetch(`https://graph.facebook.com/v21.0/${clientData.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${clientData.whatsapp_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '573228471442',
            type: 'text',
            text: { body: "Test de sistema restaurado" }
        })
    });
    
    const body = await res.json();
    console.log("Status:", res.status);
    console.dir(body, { depth: null });
}
run();
