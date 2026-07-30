const XLSX = require('xlsx');
require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563'; // Activo Morrales
  const listId = 'c876a446-d859-4cf3-903e-dad2e3918ec5';
  
  // Read Excel
  const wb = XLSX.readFile('C:\\Users\\eliza\\Downloads\\LIST DIF 1.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  
  console.log(`Found ${data.length} rows in Excel.`);
  
  // 2. Prepare Contacts
  const uniquePhones = new Set();
  const contacts = data.map(row => {
    let phoneStr = String(row['NUMERO CLIENTE'] || '');
    phoneStr = phoneStr.replace(/\D/g, '');
    
    if (phoneStr.length === 10 && phoneStr.startsWith('3')) {
       phoneStr = '57' + phoneStr;
    }
    
    return {
      list_id: listId,
      full_name: String(row['NOMBRE CLIENTE'] || 'Sin Nombre'),
      phone: phoneStr,
      status: 'pending' // Default status
    };
  }).filter(c => {
    if (c.phone.length < 10) return false;
    if (uniquePhones.has(c.phone)) return false;
    uniquePhones.add(c.phone);
    return true;
  });
  
  console.log(`Prepared ${contacts.length} UNIQUE contacts. Inserting in batches...`);
  
  // 3. Insert in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await sb.from('broadcast_contacts').upsert(batch, { onConflict: 'list_id,phone' });
    if (insertError) {
      console.error(`Error inserting batch ${i}:`, insertError);
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
  }
  
  console.log('Import completed.');
}

main().catch(console.error);
