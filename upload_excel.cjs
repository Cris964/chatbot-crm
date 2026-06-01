const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
require('dotenv').config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function uploadProducts() {
  const clientId = '5ac584f8-1d98-4583-9c2c-76a3c3cfe07d'; // Trazzos Client ID
  
  try {
    const workbook = xlsx.readFile('C:\\Users\\keine\\.gemini\\antigravity\\scratch\\Listado de productos Entrenamiento IA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    let inserts = [];
    let currentCategory = 'General';

    for (let i = 0; i < data.length; i++) {
       const row = data[i];
       
       // Empty row
       if (row.length === 0) continue;
       
       // Category header
       if (row.length === 1 && typeof row[0] === 'string') {
          currentCategory = row[0].trim();
          continue;
       }
       
       // Table header
       if (row[0] && typeof row[0] === 'string' && row[0].toLowerCase().includes('rereferncia')) {
          continue;
       }
       
       // Product row
       if (row.length >= 2 && row[0]) {
          const ref = row[0];
          const format = row[1] || '';
          const m2 = row[2] || '';
          const units = row[3] || '';
          
          let name = `${ref}`;
          if (format) name += ` ${format}`;
          
          let description = `Categoría: ${currentCategory}.`;
          if (format) description += ` Formato: ${format}.`;
          if (m2) description += ` M2 por caja: ${m2}.`;
          if (units) description += ` Unidades por caja: ${units}.`;
          
          inserts.push({
             client_id: clientId,
             name: name,
             description: description,
             price: 0,
             stock: 100, // Dummy stock
             active: true
          });
       }
    }
    
    if (inserts.length > 0) {
       // Delete existing products for Trazzos to avoid duplicates
       await supabase.from('products').delete().eq('client_id', clientId);
       
       // Chunk inserts to avoid limits
       const chunkSize = 50;
       for (let i = 0; i < inserts.length; i += chunkSize) {
          const chunk = inserts.slice(i, i + chunkSize);
          const { error } = await supabase.from('products').insert(chunk);
          if (error) console.error('Error inserting chunk:', error);
       }
       
       console.log(`Successfully uploaded ${inserts.length} products to Trazzos.`);
    } else {
       console.log('No valid products found.');
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

uploadProducts();
