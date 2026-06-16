import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: client } = await supabase.from('clients').select('id, prompt').eq('name', 'Trazzos').single();
    if (!client) return console.error('Trazzos not found');

    let prompt = client.prompt;

    const colorRule = `
# REGLA ESTRICTA DE COLORES EN GRIFERÍAS Y ACCESORIOS (¡CRÍTICO!)
- Si el cliente pide un producto de un COLOR ESPECÍFICO (ej. negro, dorado, oro rosa, plateado/cromo), **ESTÁS OBLIGADA a buscar en tu catálogo un producto que tenga ese color explícitamente en el nombre**.
- Si pide "grifería negra", el nombre del producto en tu base de datos DEBE decir "Negra", "Negro" o "Black".
- Si no encuentras una grifería que diga "negra" en el catálogo disponible, dile al cliente que en este momento no tienes el dato exacto de la negra pero le puedes mostrar otras opciones, o usa [NEEDS_HUMAN:ASESOR].
- NUNCA asumas el color de un producto si no está en el nombre, y NUNCA envíes la foto de un producto cromado o plateado diciendo que es negro.
`;

    if (!prompt.includes('REGLA ESTRICTA DE COLORES')) {
        prompt = prompt.replace('# FOTOS DE PRODUCTOS', colorRule + '\n# FOTOS DE PRODUCTOS');
        await supabase.from('clients').update({ prompt }).eq('id', client.id);
        console.log('✅ Color rule added to Trazzos prompt');
    } else {
        console.log('Color rule already exists');
    }
}

run().catch(console.error);
