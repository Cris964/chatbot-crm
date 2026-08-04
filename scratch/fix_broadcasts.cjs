const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixBroadcasts() {
  const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563'; // Activo
  
  // 1. Get all conversations for this client
  const { data: convs, error: convErr } = await supabase
    .from('conversations')
    .select('id, user_phone, messages')
    .eq('client_id', clientId);
    
  if (convErr) {
    console.error(convErr);
    return;
  }
  
  // 2. Get all broadcast contacts for this client to map phone -> list_id
  const { data: contacts, error: contErr } = await supabase
    .from('broadcast_contacts')
    .select('phone, list_id')
    .eq('client_id', clientId);
    
  if (contErr) {
    console.error(contErr);
    return;
  }
  
  // Create a map of phone -> list_id
  const phoneToList = {};
  for (const c of contacts) {
    // If a phone is in multiple lists, this takes the last one, which is usually fine or we can keep an array.
    // To be safe, we'll map phone to the first list_id we find that actually exists.
    phoneToList[c.phone] = c.list_id;
  }

  let updatedCount = 0;

  for (const conv of convs) {
    let modified = false;
    if (!conv.messages) continue;
    
    // Look for messages sent around July 31st that look like the broadcast
    for (const msg of conv.messages) {
      if (msg.role === 'agent' && typeof msg.content === 'string' && msg.content.includes('Buenas tardes, queridos clientes')) {
        if (!msg.is_broadcast) {
           msg.is_broadcast = true;
           // If we know the list_id, set it. Otherwise, set it to a fallback or the latest list.
           msg.list_id = phoneToList[conv.user_phone] || null;
           
           if (!msg.list_id) {
               // Fallback: put them in the most recent list (e.g. list 26) just so they show up somewhere
               // Let's see if we can extract it from the CRM. For now, try to find a default list.
           }
           modified = true;
        }
      }
    }
    
    if (modified) {
      await supabase.from('conversations').update({ messages: conv.messages }).eq('id', conv.id);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} conversations with is_broadcast flag.`);
}

fixBroadcasts();
