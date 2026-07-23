require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CLIENT_ID = 'c91119cc-5451-4a64-b0e8-6b53d33d5563'; // Activo Morrales

async function run() {
  try {
    console.log('Parsing leads for broadcast lists...');
    const leadsFile = 'C:\\Users\\eliza\\Downloads\\LIST DIF 1.xlsx';
    if (!fs.existsSync(leadsFile)) {
      console.log('Leads file not found at:', leadsFile);
      return;
    }
    
    const wb = xlsx.readFile(leadsFile);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Agrupar por nombre de lista
    const listsMap = {};
    
    data.forEach(row => {
      const keys = Object.keys(row);
      const getVal = (search) => {
        const key = keys.find(k => k.toLowerCase().includes(search));
        return key ? row[key] : null;
      };
      
      const name = String(getVal('nombre cliente') || getVal('nombre') || 'Cliente').trim();
      let phone = String(getVal('numero') || getVal('tel') || '').replace(/\D/g, '');
      const listName = String(getVal('nombre lista') || getVal('lista') || 'Lista General').trim();
      
      if (phone.length > 7) {
        if (!listsMap[listName]) listsMap[listName] = [];
        listsMap[listName].push({ name, phone });
      }
    });
    
    console.log(`Found ${Object.keys(listsMap).length} distinct lists.`);
    
    for (const [listName, contacts] of Object.entries(listsMap)) {
      console.log(`Processing list: ${listName} (${contacts.length} contacts)`);
      
      // Check if list exists
      let listId;
      const { data: exList } = await sb.from('broadcast_lists')
        .select('id')
        .eq('client_id', CLIENT_ID)
        .eq('name', listName)
        .single();
        
      if (exList) {
        listId = exList.id;
      } else {
        const { data: newList, error: listErr } = await sb.from('broadcast_lists')
          .insert({ client_id: CLIENT_ID, name: listName })
          .select().single();
        if (listErr) { console.error('Error creating list:', listErr); continue; }
        listId = newList.id;
      }
      
      // Insert contacts
      for (const contact of contacts) {
        const { data: exContact } = await sb.from('broadcast_contacts')
          .select('id')
          .eq('list_id', listId)
          .eq('phone', contact.phone)
          .single();
          
        if (!exContact) {
          await sb.from('broadcast_contacts').insert({
            list_id: listId,
            client_id: CLIENT_ID,
            full_name: contact.name,
            phone: contact.phone
          });
        }
      }
    }
    
    console.log('All lists and contacts inserted successfully.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
