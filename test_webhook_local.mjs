import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testWebhookLogic() {
  const senderPhone = '573000000000';
  const senderName = 'Test Webhook Sim';
  const textResponse = 'Hola desde el simulador local!';
  const clientId = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d';

  const newMsgNode = {
    role: 'user',
    content: textResponse,
    timestamp: new Date().toISOString()
  };

  try {
    let query = supabase.from('conversations').select('*');
    if (clientId) {
        query = query.eq('client_id', clientId).eq('user_phone', senderPhone).limit(1);
    } else {
        query = query.eq('user_phone', senderPhone).limit(1);
    }

    const { data: existingChats, error: chatErr } = await query;
    if (chatErr) throw chatErr;

    if (existingChats && existingChats.length > 0) {
      console.log('Chat existía. Probando update...');
      const chat = existingChats[0];
      const oldMessages = chat.messages || chat.rawMessages || [];
      const { error: updErr } = await supabase
        .from('conversations')
        .update({
           messages: [...oldMessages, newMsgNode],
           unread: true,
           updated_at: new Date().toISOString()
        })
        .eq('id', chat.id);
      
      if (updErr) throw updErr;
      console.log('Update OK');
    } else {
      console.log('Chat NO existía. Probando insert...');
      const newChatPayload = {
        user_phone: senderPhone,
        user_name: senderName,
        messages: [newMsgNode]
      };
      if (clientId) newChatPayload.client_id = clientId;

      const { data, error: insErr } = await supabase
        .from('conversations')
        .insert([newChatPayload])
        .select('*');
        
      if (insErr) {
         console.error('INSERT ERROR:', insErr);
      } else {
         console.log('INSERT SUCCESS:', data);
      }
    }
  } catch(e) {
    console.error('EXCEPTION:', e);
  }
}

testWebhookLogic();
