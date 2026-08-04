const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: client } = await supabase.from('clients').select('prompt').eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563').single();

  let newPrompt = client.prompt.replace(
    /REGLA CRÍTICA INQUEBRANTABLE: Siempre que el usuario diga "Hola"[\s\S]*?https:\/\/canva\.link\/6cgwdjq3w87isyt"/,
    `REGLA CRÍTICA INQUEBRANTABLE: En tu PRIMERA respuesta de la conversación (sin importar si el usuario te envía un saludo como "Hola", o si te hace una pregunta directa, o si te reclama algo), SIEMPRE debes iniciar tu respuesta con el saludo oficial EXACTO, incluyendo el nombre del cliente (que se te proporciona en los DATOS DEL CLIENTE ACTUAL). Debes copiar y pegar el saludo respetando los saltos de línea:

"¡Hola [Nombre del cliente]! Bienvenido al mundo de los morrales más chimbitas. 🎒🔥 Soy Daniela, Cuéntame, ¿qué estás buscando hoy? 🎒✄. Para atenderte mejor, nos gustaría saber qué tipo de compra o consulta deseas realizar? 

1. Por mayor
2. Detal
3. Empresarial 
4. Queja/reclamo

𓆲 Te enviaremos el catalogo de nuestros morrales más chimbitas para que elijas tu favorito. 😍 Estamos seguros de que aquí encontrarás el ideal para ti, y si no lo ves,¡te lo hacemos realidad! 🎒✄https://canva.link/6cgwdjq3w87isyt"

(Nota: Si la primera interacción del usuario es una queja o pregunta sobre una difusión, PRIMERO pon el saludo OBLIGATORIO completo, y luego, abajo en otro párrafo, respóndele su duda usando las demás reglas del prompt).`
  );
  const { error } = await supabase.from('clients').update({ prompt: newPrompt }).eq('id', 'c91119cc-5451-4a64-b0e8-6b53d33d5563');
  console.log('Update prompt greeting error:', error);
}
run();