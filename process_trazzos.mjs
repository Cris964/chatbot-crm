import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function processTrazzos() {
  // 1. Get Client ID for Trazzos
  const { data: clients } = await supabase.from('clients').select('id, name, prompt').ilike('name', '%Trazzos%').limit(1);
  if (!clients || clients.length === 0) {
    console.log('Client Trazzos not found');
    return;
  }
  const clientId = clients[0].id;
  console.log('Trazzos Client ID:', clientId);

  // 2. Update Prompt
  const extraInfo = `
INFORMACIÓN DE PRECIOS Y PRODUCTOS (REGLAS GENERALES):
- Porcelanatos de 60x60 desde $35.900 m2 hasta $72.900 m2
- Porcelanatos de 60x120 desde $57.900 a $135.000 m2
- Cerámicas para piso interior desde $34.900 a $78.900
- Cerámicas para piso exterior desde $38.900 a $78.900 M2
- Fachadas desde $45.900 hasta $320.000 M2
- Paredes para baño y cocina desde $38.900 m2 hasta $78.900 M2
- Pisos para baño desde $45.900 hasta $78.900 M2
Nota importante: El precio del producto varía dependiendo del diseño, y el formato o tamaño.`;

  let newPrompt = clients[0].prompt;
  if (!newPrompt.includes('INFORMACIÓN DE PRECIOS')) {
    newPrompt += '\n\n' + extraInfo;
    await supabase.from('clients').update({ prompt: newPrompt }).eq('id', clientId);
    console.log('Updated prompt with pricing info');
  }

  // 3. Read Excel file
  try {
    const workbook = xlsx.readFile('C:\\Users\\keine\\.gemini\\antigravity\\scratch\\Listado de productos Entrenamiento IA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log('Excel Rows:', data.length);
    console.log('First 3 rows:', data.slice(0, 3));
    
    // We will save this data to a JSON file to inspect it
    import('fs').then(fs => fs.writeFileSync('trazzos_products.json', JSON.stringify({clientId, data}, null, 2)));
    console.log('Saved to trazzos_products.json');
  } catch (e) {
    console.error('Error reading excel:', e);
  }
}

processTrazzos();
