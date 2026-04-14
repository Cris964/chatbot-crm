import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS Definitions
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // META WEBHOOK VERIFICATION (Fase 1)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Este es el token que el usuario pega en la casilla de Meta Developers
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'nexus_secure_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // INCOMING MESSAGES (Fase 2)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Checking if this is an Event from WhatsApp
      if (body.object !== 'whatsapp_business_account') {
        return res.status(404).send('Not a WhatsApp event');
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // Filter out empty payloads or status updates for now
      if (!changes || !changes.messages || changes.messages.length === 0) {
        return res.status(200).send('No message payload');
      }

      const messageObj = changes.messages[0];
      const contactObj = changes.contacts?.[0];
      const phoneNumberId = changes.metadata.phone_number_id;

      const senderPhone = messageObj.from;
      const senderName = contactObj?.profile?.name || 'Cliente';
      const textResponse = messageObj.text?.body || '[Multimedia/No Text]';

      console.log(`[WHATSAPP WEBHOOK] Nuevo mensaje de ${senderName} (${senderPhone}): ${textResponse}`);

      // Instanciamos Supabase desde el Edge
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
      );

      // 1. Identificar de qué empresa/tenant es el webhook según el `phone_number_id` al que escribieron
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('phone_number_id', phoneNumberId)
        .limit(1);

      if (clientErr) console.error("Error fetching client:", clientErr);

      // Fallback a un ID genérico por si no encuentra el número de teléfono
      // (Para no perder el log en caso de que Meta mande algo que no coincida).
      let clientId = null;
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      }

      // 2. Buscar si la conversación del cliente ya existe
      let query = supabase.from('conversations').select('id, rawMessages, messages');
      
      // Asegurar que asociamos la conversación a la empresa correcta.
      // Si clientId es nulo (no sabemos a quién escribió), buscamos globalmente.
      if (clientId) {
          query = query.eq('client_id', clientId).eq('phone', senderPhone).limit(1);
      } else {
          query = query.eq('phone', senderPhone).limit(1);
      }

      const { data: existingChats, error: chatErr } = await query;

      if (chatErr) throw chatErr;

      const newMsgNode = {
        role: 'user',
        content: textResponse,
        timestamp: new Date().toISOString()
      };

      if (existingChats && existingChats.length > 0) {
        // ACTUALIZAR CONVERSACIÓN EXISTENTE
        const chat = existingChats[0];
        const oldMessages = chat.messages || chat.rawMessages || [];

        await supabase
          .from('conversations')
          .update({
             messages: [...oldMessages, newMsgNode],
             unread: true,
             updated_at: new Date().toISOString()
          })
          .eq('id', chat.id);
        
        console.log(`Conversación ${chat.id} actualizada exitosamente.`);
      } else {
        // CREAR NUEVA CONVERSACIÓN
        const newChatPayload = {
          phone: senderPhone,
          name: senderName,
          channel: 'whatsapp',
          unread: true,
          messages: [newMsgNode],
          needs_human: true
        };

        if (clientId) newChatPayload.client_id = clientId;

        await supabase
          .from('conversations')
          .insert([newChatPayload]);
          
        console.log(`Nueva conversación registrada en CRM.`);
      }

      // Devolver Status 200 INMEDIATO a Meta para que no hagan reintentos eternos de webhook
      return res.status(200).send('EVENT_RECEIVED');

    } catch (e) {
      console.error("[WEBHOOK EXCEPTION]", e);
      return res.status(500).json({ error: 'Internal logic fail' });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
