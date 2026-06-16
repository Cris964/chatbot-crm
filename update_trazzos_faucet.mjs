import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addFaucetRule() {
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', 'c90f532b-0b32-4614-9c21-bbf664213468');
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const faucetRule = `
**9. SI EL CLIENTE BUSCA LLAVES / GRIFERÍA PARA LAVAMANOS:**
Antes de dar precios, SIEMPRE debes perfilar preguntando qué tipo de lavamanos tiene el cliente:
- "¿Es para lavamanos de sobreponer (tipo vessel) que requiere llave alta?"
- "O ¿Es para lavamanos de incrustar (tipo placa) que requiere llave baja?"
`;

    // Only add if it doesn't already exist
    if (!prompt.includes('LLAVES / GRIFERÍA PARA LAVAMANOS')) {
        // Insert right before "CÁLCULOS TÉCNICOS"
        prompt = prompt.replace('# CÁLCULOS TÉCNICOS Y UNIDADES', faucetRule + '\n# CÁLCULOS TÉCNICOS Y UNIDADES');
        await supabase.from('clients').update({ prompt }).eq('id', clients[0].id);
        console.log('✅ Faucet rule added to prompt');
    } else {
        console.log('Faucet rule already in prompt');
    }
}

addFaucetRule();
