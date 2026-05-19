import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, project_type, source, notes, client_id } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'El campo "phone" (teléfono) es obligatorio.' });
    }

    const senderName = name || 'Cliente';
    const projectType = project_type || 'Remodelación';
    const leadSource = source || 'Formulario de Leads / Google Sheets';
    const leadNotes = notes || '';

    // Normalizar teléfono
    let senderPhone = String(phone).replace(/\D/g, '');
    if (senderPhone.startsWith('00')) {
      senderPhone = senderPhone.substring(2);
    }
    if (senderPhone.length === 10 && senderPhone.startsWith('3')) {
      senderPhone = '57' + senderPhone; // Agregar indicativo Colombia si falta
    }

    if (senderPhone.length < 8) {
      return res.status(400).json({ error: 'El número de teléfono proporcionado no es válido.' });
    }

    // Inicializar Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Identificar cliente (Trazzos por defecto o client_id enviado)
    // ID de Trazzos Espacios y Arquitectura
    const DEFAULT_CLIENT_ID = 'c90f532b-0b32-4614-9c21-bbf664213468';
    const targetClientId = client_id || DEFAULT_CLIENT_ID;

    const { data: clientSetup, error: clientErr } = await supabase
      .from('clients')
      .select('id, user_id, active, prompt, whatsapp_token, name, phone_number_id')
      .eq('id', targetClientId)
      .single();

    if (clientErr || !clientSetup) {
      return res.status(404).json({ error: 'Empresa no encontrada en el sistema.', details: clientErr });
    }

    if (clientSetup.active === false) {
      return res.status(400).json({ error: 'La cuenta del cliente no está activa.' });
    }

    console.log(`[LEAD INGEST] Procesando lead para ${clientSetup.name}: ${senderName} (${senderPhone})`);

    // 2. Gestionar Conversación
    let { data: existingChats, error: chatErr } = await supabase
      .from('conversations')
      .select('id, messages')
      .eq('client_id', clientSetup.id)
      .eq('user_phone', senderPhone)
      .limit(1);

    if (chatErr) {
      return res.status(500).json({ error: 'Error al buscar conversación existente.', details: chatErr });
    }

    let finalMessages = [];
    let conversationId = null;
    let isNewChat = true;

    if (existingChats && existingChats.length > 0) {
      conversationId = existingChats[0].id;
      finalMessages = existingChats[0].messages || [];
      isNewChat = false;
    }

    // 3. Preparar contexto para OpenRouter
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({ error: 'Error de configuración: Clave de OpenRouter faltante en el servidor.' });
    }

    const leadSystemMsg = `[SISTEMA - NUEVO LEAD]: Este cliente acaba de registrarse mediante un ${leadSource}.
Datos del Lead:
- Nombre: ${senderName}
- Teléfono: ${senderPhone}
- Interés: ${projectType}
- Notas: ${leadNotes || 'Ninguna'}

REGLAS PARA TU RESPUESTA:
1. Dale una cálida bienvenida.
2. Salúdalo por su nombre (${senderName}) y preséntate como Cami de Trazzos.
3. Hazle la primera pregunta de forma muy amigable, corta y directa para iniciar la asesoría (punto por punto), por ejemplo, preguntándole más detalles de su proyecto de ${projectType} o si el inmueble es nuevo/obra gris o remodelación.
4. Recuerda: NUNCA uses párrafos largos, usa saltos de línea y no hables de precios aún.`;

    const aiMessages = [
      { role: 'system', content: clientSetup.prompt },
      { role: 'system', content: leadSystemMsg }
    ];

    if (finalMessages.length > 0) {
      aiMessages.push(...finalMessages.slice(-10).map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content
      })));
    }

    // Llamar a OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatbot-crm-xi.vercel.app/',
        'X-Title': `NexusCRM - Lead Contact - ${clientSetup.name}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: aiMessages,
        max_tokens: 400
      })
    });

    if (!aiResponse.ok) {
      const aiErrText = await aiResponse.text();
      return res.status(502).json({ error: 'Error al generar la respuesta de la IA.', details: aiErrText });
    }

    const aiData = await aiResponse.json();
    const botReplyText = aiData.choices?.[0]?.message?.content;

    if (!botReplyText) {
      return res.status(500).json({ error: 'La IA no devolvió ninguna respuesta.' });
    }

    // Limpiar tags del mensaje
    let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').replace(/\[SALE_CONFIRMED: .*?\]/, '').trim();

    const newMsgNode = {
      role: 'agent',
      content: cleanReply,
      timestamp: new Date().toISOString(),
      meta_id: 'LEAD_CONTACT_' + Date.now()
    };

    // 4. Guardar conversación
    if (isNewChat) {
      const { data: insertedChat, error: insertErr } = await supabase.from('conversations').insert([{
        user_phone: senderPhone,
        user_name: senderName,
        messages: [newMsgNode],
        client_id: clientSetup.id,
        user_id: clientSetup.user_id
      }]).select('id').single();

      if (insertErr) {
        return res.status(500).json({ error: 'Error al crear la conversación en la base de datos.', details: insertErr });
      }
      conversationId = insertedChat?.id;
    } else {
      const { error: updateErr } = await supabase.from('conversations').update({
        messages: [...finalMessages, newMsgNode],
        updated_at: new Date().toISOString()
      }).eq('id', conversationId);

      if (updateErr) {
        return res.status(500).json({ error: 'Error al actualizar los mensajes en la base de datos.', details: updateErr });
      }
    }

    // 5. Enviar mensaje a WhatsApp
    const WHATSAPP_TOKEN = clientSetup.whatsapp_token;
    const PHONE_NUMBER_ID = clientSetup.phone_number_id;
    let whatsappStatus = 'SENT';
    let whatsappError = null;

    if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
      try {
        const waResponse = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: cleanReply }
          })
        });

        const waData = await waResponse.json();

        if (!waResponse.ok) {
          whatsappStatus = 'FAILED';
          whatsappError = waData.error;
          console.error('[LEAD WA ERROR]', waData);
          
          // Registrar error en el log de la conversación
          const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
          await supabase.from('conversations').update({
            messages: [...(latest?.messages || []), { role: 'agent', content: `[ERROR META]: ${waData.error?.message || 'Error de envío'}`, timestamp: new Date().toISOString() }]
          }).eq('id', conversationId);
        }
      } catch (waErr) {
        whatsappStatus = 'FAILED';
        whatsappError = waErr.message;
        console.error('[LEAD WA EXCEPTION]', waErr);
      }
    } else {
      whatsappStatus = 'FAILED';
      whatsappError = 'WhatsApp credentials missing on client setup';
      console.warn('[LEAD WA] Faltan credenciales de WhatsApp para el cliente.');
    }

    return res.status(200).json({
      success: true,
      conversation_id: conversationId,
      phone: senderPhone,
      message_sent: cleanReply,
      whatsapp: {
        status: whatsappStatus,
        error: whatsappError
      }
    });

  } catch (err) {
    console.error('[LEAD HANDLER EXCEPTION]', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
