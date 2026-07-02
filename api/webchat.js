import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zgkwgilghzgtteljfdqv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, sessionId, message } = req.body;

    if (!clientId || !sessionId || !message) {
      return res.status(400).json({ error: 'Missing required fields (clientId, sessionId, message)' });
    }

    // 1. Obtener datos del cliente (Empresa)
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId);

    if (clientErr || !clients || clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientSetup = clients[0];
    if (clientSetup.active === false) {
      return res.status(403).json({ error: 'Client account is inactive' });
    }

    // 2. Buscar o crear la conversación (basada en sessionId como identificador web)
    const { data: existingChats, error: chatErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_phone', sessionId) // Usamos el sessionId en lugar del número de teléfono real temporalmente
      .eq('channel', 'web')
      .order('updated_at', { ascending: false })
      .limit(1);

    let conversationId;
    let finalMessages = [];

    if (!existingChats || existingChats.length === 0) {
      const newChat = {
        client_id: clientId,
        user_phone: sessionId,
        user_name: 'Usuario Web',
        messages: [{ role: 'user', content: message, timestamp: new Date().toISOString() }],
        status: 'active',
        needs_human: false,
        channel: 'web'
      };
      const { data: inserted, error: insertErr } = await supabase.from('conversations').insert([newChat]).select('id, messages').single();
      if (insertErr) throw insertErr;
      conversationId = inserted.id;
      finalMessages = inserted.messages;
    } else {
      const chat = existingChats[0];
      conversationId = chat.id;

      if (chat.needs_human) {
         return res.status(200).json({ 
           messages: [{ type: 'text', content: 'Un asesor humano se pondrá en contacto contigo pronto. Por favor, espera unos minutos.' }]
         });
      }

      const updatedMsgs = [...(chat.messages || []), { role: 'user', content: message, timestamp: new Date().toISOString() }];
      const { error: updateErr } = await supabase.from('conversations')
        .update({ messages: updatedMsgs, updated_at: new Date().toISOString(), status: 'active', archived: false })
        .eq('id', conversationId);
      if (updateErr) throw updateErr;
      
      finalMessages = updatedMsgs;
    }

    // 3. Llamar a la IA usando el Helper compartido
    const { dispatchToAI } = await import('./_aiHelper.js');
    let messageQueue = [];

    try {
        messageQueue = await dispatchToAI({
            supabase,
            clientId,
            clientSetup,
            openRouterKey: process.env.OPENROUTER_API_KEY,
            conversationId,
            finalMessages,
            senderName: 'Usuario Web',
            senderPhone: sessionId,
            channel: 'web'
        });
    } catch(aiError) {
        console.error('[WEBCHAT AI ERROR]', aiError);
        return res.status(500).json({ error: 'AI Dispatch Failed' });
    }

    // 4. Devolver la respuesta de la IA a la página web
    return res.status(200).json({ messages: messageQueue });

  } catch (error) {
    console.error('[WEBCHAT CRITICAL ERROR]', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
