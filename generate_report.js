import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    // 1. Get Activo Morrales client id
    const { data: client } = await supabase.from('clients').select('id').ilike('name', '%activo%').single();
    if (!client) return console.log('Client not found');
    const clientId = client.id;

    // 2. Products without photos
    const { data: products } = await supabase
        .from('products')
        .select('name, image_url')
        .eq('client_id', clientId)
        .or('image_url.is.null,image_url.eq.,image_url.ilike.%woocommerce-placeholder%');
    
    // 3. Contacts with frequent Meta errors
    const { data: convs } = await supabase
        .from('conversations')
        .select('user_phone, user_name, messages')
        .eq('client_id', clientId);
    
    const errorPhones = {};
    for (const c of convs) {
        if (!c.messages) continue;
        const failedMsgs = c.messages.filter(m => m.role === 'agent' && (m.content || '').includes('Error de Meta'));
        if (failedMsgs.length > 0) {
            errorPhones[c.user_phone] = {
                name: c.user_name,
                fails: failedMsgs.length,
                errors: [...new Set(failedMsgs.map(m => m.content))]
            };
        }
    }
    
    const failedList = Object.entries(errorPhones).sort((a,b) => b[1].fails - a[1].fails).slice(0, 50);
    
    fs.writeFileSync('report.json', JSON.stringify({
        productsWithoutPhotos: products.map(p => p.name),
        contactsWithErrors: failedList.map(([phone, data]) => ({ phone, ...data }))
    }, null, 2));
    console.log("Done");
}

check();
