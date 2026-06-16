import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateTrearqRule() {
    const clientId = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const { data: clients } = await supabase.from('clients').select('id, prompt').eq('id', clientId);
    
    if (!clients || clients.length === 0) return;
    
    let prompt = clients[0].prompt;
    
    const oldRule = `**1. SI EL CLIENTE BUSCA REMODELACIÓN COMPLETA (TREARQ):**
Enfócate en el servicio de remodelación, NO en la venta suelta de materiales.
1. ¿Qué espacio vas a remodelar? (Integral, baño o cocina)
2. ¿Dónde está ubicado el proyecto?
3. ¿Qué presupuesto aproximado tienes?
4. Agendar cita.
Menciona: "Remodelación segura, sin sobrecostos ni complicaciones. Plan Todo Incluido: Materiales, Mano de Obra y Supervisión."
*(Y recuerda usar [NEEDS_HUMAN:TREARQ] al final si el cliente ya está requiriendo al experto en proyectos).*`;

    const newRule = `**1. SI EL CLIENTE BUSCA REMODELACIÓN COMPLETA (TREARQ):**
Enfócate en el servicio de remodelación integral, NO en la venta suelta de materiales.
1. ¿Qué espacio vas a remodelar? (Integral, baño o cocina)
2. Si es una remodelación integral de un apartamento en OBRA GRIS, pregúntale obligatoriamente: "¿Cuál es el nombre del proyecto o conjunto residencial?"
3. ¿Dónde está ubicado?
4. ¿Qué presupuesto aproximado tienes?
5. Agendar cita: Infórmale al cliente que **LA PRIMERA REUNIÓN DE ASESORÍA ES VIRTUAL** (por videollamada) para conocer los detalles iniciales de su espacio.

Menciona: "Remodelación segura, sin sobrecostos ni complicaciones. Plan Todo Incluido: Materiales, Mano de Obra y Supervisión."
*(Y recuerda usar [NEEDS_HUMAN:TREARQ] al final para notificar al equipo experto).*`;

    // Try to replace the old rule with the new rule
    if (prompt.includes('**1. SI EL CLIENTE BUSCA REMODELACIÓN COMPLETA (TREARQ):**')) {
        const regex = /\*\*1\. SI EL CLIENTE BUSCA REMODELACIÓN COMPLETA \(TREARQ\):\*\*[\s\S]*?\*\(Y recuerda usar \[NEEDS_HUMAN:TREARQ\] al final[\s\S]*?\)\.\*/;
        prompt = prompt.replace(regex, newRule);
        
        await supabase.from('clients').update({ prompt }).eq('id', clientId);
        console.log('✅ Trearq virtual meeting rule updated in prompt');
    } else {
        console.log('Could not find the Trearq rule block to replace.');
    }
}

updateTrearqRule();
