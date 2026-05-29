import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRAZZOS_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
const openRouterKey = process.env.OPENROUTER_API_KEY;

// Simulate a lead coming in
const lead = {
  name: 'Cristian Test Lead',
  phone: '573163799745',
  project_type: 'Remodelación de Cocina Premium',
  source: 'Formulario de Meta Ads',
  notes: 'Quiere cambiar los mesones y carpintería.'
};

async function runSimulation() {
  console.log("Starting simulation for new lead...");

  // 1. Get Client Settings
  const { data: clientSetup, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('id', TRAZZOS_ID)
    .single();

  if (clientErr || !clientSetup) {
    console.error("Client not found:", clientErr);
    return;
  }

  console.log(`Using client: ${clientSetup.name}`);

  // Clean phone number (simulated)
  let cleanPhone = lead.phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
  
  // 2. Check or create conversation
  let { data: chat } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', TRAZZOS_ID)
    .eq('user_phone', cleanPhone)
    .maybeSingle();

  // If conversation doesn't exist, create it
  let conversationId = chat?.id;
  let finalMessages = chat?.messages || [];

  const leadSystemMsg = `[SISTEMA - NUEVO LEAD]: Este cliente acaba de registrarse mediante un ${lead.source}. 
Datos del Lead:
- Nombre: ${lead.name}
- Teléfono: ${cleanPhone}
- Interés: ${lead.project_type}
- Notas: ${lead.notes || 'Ninguna'}

REGLAS PARA TU RESPUESTA:
1. Dale una cálida bienvenida.
2. Salúdalo por su nombre (${lead.name}) y preséntate como Cami de Trazzos.
3. Hazle la primera pregunta de forma muy amigable, corta y directa para iniciar la asesoría (punto por punto), por ejemplo, preguntándole más detalles de su cocina o si el inmueble es nuevo/obra gris o remodelación.
4. Recuerda: NUNCA uses párrafos largos, usa saltos de línea y no hables de precios aún.`;

  // We append a system message to history or use it as current context
  const aiMessages = [
    { role: 'system', content: clientSetup.prompt },
    { role: 'system', content: leadSystemMsg }
  ];

  // If there are previous messages, we can append them
  if (finalMessages.length > 0) {
    aiMessages.push(...finalMessages.slice(-10).map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.content
    })));
  }

  console.log("Calling OpenRouter...");
  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
      'X-Title': `NexusCRM - Lead Contact`
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: aiMessages,
      max_tokens: 400
    })
  });

  if (!aiResponse.ok) {
    console.error("AI Error:", await aiResponse.text());
    return;
  }

  const aiData = await aiResponse.json();
  const botReplyText = aiData.choices?.[0]?.message?.content;
  console.log("Generated Message from Cami:\n", botReplyText);

  if (!botReplyText) {
    console.error("No reply generated.");
    return;
  }

  // clean reply from tags if any
  let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').replace(/\[SALE_CONFIRMED: .*?\]/, '').trim();

  // 3. Save conversation messages
  const newMsgNode = {
    role: 'agent',
    content: cleanReply,
    timestamp: new Date().toISOString(),
    meta_id: 'LEAD_CONTACT_' + Date.now()
  };

  if (conversationId) {
    await supabase.from('conversations').update({
      messages: [...finalMessages, newMsgNode],
      updated_at: new Date().toISOString()
    }).eq('id', conversationId);
    console.log("Existing conversation updated.");
  } else {
    const { data: insertedChat } = await supabase.from('conversations').insert([{
      user_phone: cleanPhone,
      user_name: lead.name,
      messages: [newMsgNode],
      client_id: TRAZZOS_ID,
      user_id: clientSetup.user_id
    }]).select('id').single();
    conversationId = insertedChat?.id;
    console.log("New conversation created with ID:", conversationId);
  }

  // 4. Send to WhatsApp
  const WHATSAPP_TOKEN = clientSetup.whatsapp_token;
  const PHONE_NUMBER_ID = clientSetup.phone_number_id;

  if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
    console.log("Sending message to WhatsApp...");
    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: cleanReply }
      })
    });

    const result = await response.json();
    console.log("WhatsApp API Response:", result);
  } else {
    console.warn("WhatsApp credentials not found.");
  }
}

runSimulation();
