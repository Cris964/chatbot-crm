import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applyStrictRules() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const newRules = `
# REGLAS ESTRICTAS DE CONFIDENCIALIDAD DE MARCA Y PRODUCTO (CRÍTICO)
1. **NUNCA DES EL NOMBRE COMERCIAL EXACTO DEL PRODUCTO:** Está estrictamente prohibido decirle al cliente la referencia exacta (ej. NUNCA digas "Itria Gris" o "Monferrato"). 
2. **DESCRIBE EL PRODUCTO:** Siempre debes referirte a los productos por sus características técnicas y de diseño (ej. "Te recomiendo un excelente piso cerámico acabado mate en color gris formato 60x60"). Esto evita que el cliente busque el nombre en internet y lo compre en otro lugar.

# REGLA DE PERFILAMIENTO ESTRICTO (PROHIBIDO RECOMENDAR SIN PERFILAR)
- Está PROHIBIDO recomendar un producto o dar precio si el cliente no ha respondido todas las preguntas de la venta consultiva.
- NUNCA asumas lo que el cliente quiere. Si te piden "un piso de cerámica", DEBES preguntar primero por el acabado (brillante o mate) y luego por el color. 
- Haz UNA PREGUNTA a la vez. No envíes una lista gigante de preguntas.
`;

    // 1. Insert new strict rules near the top, after the persona definition
    if (!prompt.includes('REGLAS ESTRICTAS DE CONFIDENCIALIDAD DE MARCA')) {
        prompt = prompt.replace('# REGLA DE MENSAJES CORTOS Y MULTIMEDIA', newRules + '\n# REGLA DE MENSAJES CORTOS Y MULTIMEDIA');
    }

    // 2. Update Box Calculations rule
    const oldCálculos = `# CÁLCULOS TÉCNICOS Y UNIDADES
- Áreas de pisos/paredes: SIEMPRE en m². Unidad de empaque cerrada.
- Pegante: Por BULTOS de 25 kg. (Hasta 60x60: 1 bulto x 3.5 m². Mayor a 60x60: 1 bulto x 2.5 m²).
- Guardaescobas: En tiras de 2.5 m. Calcular perímetro del espacio.`;

    const newCálculos = `# CÁLCULOS TÉCNICOS Y UNIDADES
- Áreas de pisos/paredes: SIEMPRE cotiza en m². **NO le menciones al cliente el número exacto de cajas que necesita a menos que te lo pregunte explícitamente**. Solo dale el valor o requerimiento en metros cuadrados.
- Pegante: Por BULTOS de 25 kg. (Hasta 60x60: 1 bulto x 3.5 m². Mayor a 60x60: 1 bulto x 2.5 m²).
- Guardaescobas: En tiras de 2.5 m. Calcular perímetro del espacio.`;

    if (prompt.includes(oldCálculos)) {
        prompt = prompt.replace(oldCálculos, newCálculos);
    } else {
        // Just in case it slightly differs
        prompt = prompt.replace(/- Áreas de pisos\/paredes: SIEMPRE en m²\. Unidad de empaque cerrada\./, '- Áreas de pisos/paredes: SIEMPRE cotiza en m². **NO le menciones al cliente el número exacto de cajas que necesita a menos que te lo pregunte explícitamente**.');
    }

    // 3. Reinforce "una pregunta a la vez" in the Consultative step section
    prompt = prompt.replace('NUNCA hagas todas las preguntas de una sola vez.', 'NUNCA hagas todas las preguntas de una sola vez. **DEBES OBLIGAR AL CLIENTE A RESPONDER EL ACABADO Y EL COLOR ANTES DE RECOMENDARLE CUALQUIER REFERENCIA.**');

    await supabase.from('clients').update({ prompt }).eq('id', clientId);
    console.log('✅ Strict rules applied successfully');
}

applyStrictRules();
