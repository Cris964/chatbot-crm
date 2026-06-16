import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addFormats() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const formatsInfo = `\n*(Formatos disponibles en nuestro catálogo: 30x60, 31x101, 50x100, 51x51, 55x55, 58x118, 60x60 y grandes formatos como 60x120).*`;

    if (!prompt.includes('Formatos disponibles en nuestro catálogo')) {
        prompt = prompt.replace('5. ¿Algún color de preferencia?', '5. ¿Algún color de preferencia?' + formatsInfo);
        
        await supabase.from('clients').update({ prompt }).eq('id', clientId);
        console.log('✅ Added formats info to prompt');
    } else {
        console.log('Formats info already present');
    }
}

addFormats();
