const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: client } = await supabase.from('clients').select('prompt').eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563').single();
  let newPrompt = client.prompt + `\n\n# Horarios de Atención\nNuestro horario laboral es de Lunes a Sábados de 9:00 AM a 6:00 PM. Como ahora se te proporciona la FECHA Y HORA ACTUAL (BOGOTÁ), debes verificar si el cliente escribe fuera de este horario (noches, madrugadas o domingos/festivos). Si es así, responde su consulta si puedes, pero luego añade amablemente que dado que se encuentran fuera del horario laboral, un asesor continuará con su solicitud en el horario correspondiente.\n\n# Estilo del Saludo Inicial\nCuando envíes el Saludo Inicial OBLIGATORIO, DEBES enviarlo EXACTAMENTE como está escrito. ESTÉ ESTRICTAMENTE PROHIBIDO agregar frases adicionales de relleno al final como "Por favor, indícame qué tipo de información..." o "Una vez que tenga un poco más de información...". El mensaje debe terminar exactamente en el link del catálogo.` ;
  const { error } = await supabase.from('clients').update({ prompt: newPrompt }).eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  console.log('Update prompt error:', error);
}
run();