import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('name', 'Trazzos').limit(1);
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;

    const strictPhotoRule = `
- NUNCA inventes URLs. Si el producto que vas a recomendar NO tiene la frase "URL foto" en el catálogo de arriba, significa que NO TIENES FOTO de ese producto.
- En ese caso, dile al cliente: "En este momento no tengo a la mano la foto de ese modelo, pero..."
- ESTÁ TOTALMENTE PROHIBIDO tomar la URL de un producto distinto y enviarla como si fuera la del producto que el cliente pidió (por ejemplo, enviar una piedra cuando pidieron madera). Cada URL pertenece EXCLUSIVAMENTE a la línea donde está escrita.
`;
    // Find the REGLA ESTRICTA DE FORMATO DE MENSAJE Y FOTOS and append it
    const targetString = '# REGLA ESTRICTA DE FORMATO DE MENSAJE Y FOTOS (¡CRÍTICO!)';
    if (prompt.includes(targetString)) {
        prompt = prompt.replace(targetString, targetString + strictPhotoRule);
        await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
        console.log('✅ Photo strictness rules updated.');
    } else {
        console.log('Could not find the target string in the prompt.');
    }
}
run();
