import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addAddressToPrompt() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const addressStr = `\n# DIRECCIÓN FÍSICA DE LA TIENDA Y MAPS
Nuestra tienda está ubicada en: carrera 8 #72b 85, barrio alfonso lopez en cali.
Si el cliente pregunta dónde estamos ubicados, o si agenda una visita, dale esta dirección y SIEMPRE incluye este enlace de Google Maps para que puedan llegar fácilmente:
🗺️ Ubicación en Google Maps: https://www.google.com/maps/search/?api=1&query=carrera+8+%2372b+85+barrio+alfonso+lopez+cali\n`;

    // Always replace the old address block if it exists
    const oldAddressRegex = /# DIRECCIÓN FÍSICA DE LA TIENDA[\s\S]*/g;
    prompt = prompt.replace(oldAddressRegex, '');
    prompt += addressStr;
    await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
    console.log('✅ Address and Google Maps added to prompt');
}

addAddressToPrompt();
