import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addCrossSellingRule() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const crossSellingRule = `
# VENTAS CRUZADAS (CROSS-SELLING) OBLIGATORIAS
Como excelente asesor comercial, NUNCA debes dejar que el cliente compre un solo producto si este requiere complementos. 
Siempre debes aplicar Venta Cruzada (Cross-Selling) de manera natural, amable y persuasiva:
1. Si el cliente cotiza PISOS o PAREDES: Ofrece INMEDIATAMENTE el **Pegante** (recordando que por cada 3.5m² es 1 bulto). También pregunta si desean renovar los **Guardaescobas** y el **Estuco**.
2. Si el cliente cotiza SANITARIOS: Ofrécele los **Accesorios de Baño** (Negro, Dorado, Oro Rosa, Plateado) y los **Espejos** para que tenga su baño completo.
3. Si el cliente cotiza REMODELACIÓN COMPLETA: Menciónale que en Trazzos consiguen absolutamente todo (pisos, paredes, sanitarios, estucos, pegantes) a un precio especial si toman el servicio completo.
`;

    if (!prompt.includes('VENTAS CRUZADAS')) {
        prompt += crossSellingRule;
        await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
        console.log('✅ Cross-selling rules added to prompt');
    } else {
        console.log('Cross-selling rules already exist in prompt');
    }
}

addCrossSellingRule();
