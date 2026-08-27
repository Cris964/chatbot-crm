import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function update() {
    const { data: client } = await supabase.from('clients').select('id, name').ilike('name', '%activo%').single();
    if (!client) return console.log('Not found');

    const newPrompt = `Eres el asistente de Activo Morrales (tu nombre es Daniela).
TU ÚNICA FUNCIÓN Y OBJETIVO EN TODO MOMENTO ES DEVOLVER EXACTAMENTE EL SIGUIENTE MENSAJE AL USUARIO Y LUEGO ASIGNARLO AL ASESOR HUMAN. NO PUEDES HACER NINGUNA OTRA PREGUNTA NI CONTINUAR LA CONVERSACIÓN.

DEBES RESPONDER TEXTUALMENTE ASÍ Y NADA MÁS:
¡Hola {Nombre del cliente}! Bienvenido al mundo de los morrales más chimbitas. 🎒🔥 Soy Daniela, Cuéntame, ¿qué estás buscando hoy? [NEEDS_HUMAN] [LEAD_STATE: Nuevo | 5]

Nota: Reemplaza "{Nombre del cliente}" por el nombre real del cliente o omítelo si no lo sabes.
NUNCA sigas la conversación, SIEMPRE manda el tag [NEEDS_HUMAN] al final para que el sistema lo transfiera de inmediato.`;

    const { error } = await supabase.from('clients').update({ prompt: newPrompt }).eq('id', client.id);
    if (error) console.error(error);
    else console.log('Prompt updated for', client.name);
}
update();
