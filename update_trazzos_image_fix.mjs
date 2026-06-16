import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixImageFormat() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const oldPhotosRuleRegex = /# FOTOS DE PRODUCTOS[\s\S]*?Nunca envíes links de Google Drive\)\./;
    
    const newPhotosRule = `# FOTOS DE PRODUCTOS Y CATÁLOGO (¡PROHIBIDO USAR MARKDOWN!)
- NUNCA, bajo ninguna circunstancia, uses el formato Markdown para enlaces o imágenes (ej. PROHIBIDO usar \`[Nombre](URL)\` o \`![Nombre](URL)\`).
- Si vas a enviar una foto, DEBES usar ÚNICA Y EXCLUSIVAMENTE esta etiqueta especial al final de tu mensaje: [SEND_IMAGE: URL_DE_LA_FOTO]
- Ejemplo correcto: "Aquí tienes la foto del producto que me pediste. [SEND_IMAGE: https://ejemplo.com/foto.jpg]"`;

    if (prompt.match(oldPhotosRuleRegex)) {
        prompt = prompt.replace(oldPhotosRuleRegex, newPhotosRule);
        await supabase.from('clients').update({ prompt }).eq('id', clientId);
        console.log('✅ Image format rule fixed in prompt');
    } else if (prompt.includes('# FOTOS DE PRODUCTOS')) {
        prompt = prompt.replace('# FOTOS DE PRODUCTOS', newPhotosRule);
        await supabase.from('clients').update({ prompt }).eq('id', clientId);
        console.log('✅ Image format rule appended/fixed');
    } else {
        console.log('Could not find the photos section.');
    }
}

fixImageFormat();
