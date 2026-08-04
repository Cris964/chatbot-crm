const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixBroadcasts() {
  const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563'; // Activo
  
  const { data: convs, error: convErr } = await supabase
    .from('conversations')
    .select('id, user_phone, messages')
    .eq('client_id', clientId);
    
  if (convErr) return;
  
  const { data: contacts, error: contErr } = await supabase
    .from('broadcast_contacts')
    .select('phone, list_id')
    .eq('client_id', clientId);
    
  if (contErr) return;
  
  const phoneToList = {};
  for (const c of contacts) {
    let raw = c.phone.replace(/\D/g, '');
    phoneToList[raw] = c.list_id;
  }

  let updatedCount = 0;

  for (const conv of convs) {
    let modified = false;
    if (!conv.messages) continue;
    
    for (const msg of conv.messages) {
      if (msg.role === 'agent' && typeof msg.content === 'string' && msg.content.includes('Buenas tardes, queridos clientes')) {
        let phoneNo57 = conv.user_phone.startsWith('57') ? conv.user_phone.substring(2) : conv.user_phone;
        
        let correctListId = phoneToList[phoneNo57] || phoneToList[conv.user_phone];
        
        // If they still don't match anything, we will assign them to list 24 just to ensure they appear
        if (!correctListId) {
            correctListId = 'd3bd71d0-dfa5-4f7f-bf46-af2788fc0231'; // ID for list "24"
        }

        if (msg.list_id !== correctListId || !msg.is_broadcast) {
           msg.is_broadcast = true;
           msg.list_id = correctListId;
           modified = true;
        }
      }
    }
    
    if (modified) {
      await supabase.from('conversations').update({ messages: conv.messages }).eq('id', conv.id);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} conversations with list_id`);
}

fixBroadcasts();
