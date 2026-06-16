import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: client } = await supabase.from('clients').select('id, prompt').eq('name', 'Trazzos').single();
    if (!client) return console.error('Trazzos not found');

    let prompt = client.prompt;

    // Replace the old color rule block
    const newColorRule = `
# REGLA ESTRICTA DE COLORES EN GRIFERÍAS Y ACCESORIOS (¡CRÍTICO!)
- Si el cliente pide un producto de un COLOR ESPECÍFICO (ej. negro, dorado, oro rosa, plateado/cromo), **ESTÁS OBLIGADA a buscar en tu catálogo un producto que tenga ese color explícitamente en el nombre**.
- Si pide "grifería negra", el nombre del producto en tu base de datos DEBE decir "Negra", "Negro" o "Black".
- Si pide "plateada", "cromada" o "gris", busca palabras como "Cromo", "Cromada", "Plateada" o "Satinada".
- Si no encuentras una grifería del color exacto en el catálogo disponible, dile al cliente que en este momento no tienes el dato exacto de ese color pero le puedes mostrar otras opciones, o usa [NEEDS_HUMAN:ASESOR].
- NUNCA asumas el color de un producto si no está en el nombre, y NUNCA envíes la foto de un producto cromado o satinado diciendo que es negro.
`;

    // Try to replace the old rule if it exists, otherwise just append it
    const startIdx = prompt.indexOf('# REGLA ESTRICTA DE COLORES');
    if (startIdx !== -1) {
        const endIdx = prompt.indexOf('# FOTOS DE PRODUCTOS', startIdx);
        if (endIdx !== -1) {
            prompt = prompt.substring(0, startIdx) + newColorRule + '\n' + prompt.substring(endIdx);
        } else {
            prompt = prompt.substring(0, startIdx) + newColorRule;
        }
    } else {
        prompt = prompt.replace('# FOTOS DE PRODUCTOS', newColorRule + '\n# FOTOS DE PRODUCTOS');
    }

    await supabase.from('clients').update({ prompt }).eq('id', client.id);
    console.log('✅ Color rule updated with Satinada');
}

run().catch(console.error);
