require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CLIENT_ID = 'c91119cc-5451-4a64-b0e8-6b53d33d5563';

async function run() {
  try {
    // 1. Parse Products
    console.log('Parsing products...');
    const productsFile = 'C:\\Users\\eliza\\Downloads\\LISTA DE PRECIOS 1.xlsx';
    if (fs.existsSync(productsFile)) {
      const wb = xlsx.readFile(productsFile);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      const products = data.map(row => {
        const keys = Object.keys(row);
        const getVal = (search) => {
          const key = keys.find(k => k.toLowerCase().includes(search));
          return key ? row[key] : null;
        };
        
        const name = getVal('descripcion') || getVal('nombre') || 'Producto sin nombre';
        const priceDetal = parseFloat(getVal('detal') || 0);
        const priceMayor = parseFloat(getVal('mayor') || 0);
        
        let description = `Precio detal: $${priceDetal}`;
        if (priceMayor > 0) description += ` | Precio por mayor: $${priceMayor}`;
        
        return {
          client_id: CLIENT_ID,
          name: String(name).trim(),
          description: description,
          price: priceDetal,
          category: 'Morrales',
          stock: 100,
          image_url: 'https://activomorrales.com/wp-content/uploads/woocommerce-placeholder.png'
        };
      }).filter(p => p.name !== 'Producto sin nombre' && p.price > 0);
      
      console.log(`Found ${products.length} products. Inserting...`);
      for (const p of products) {
        const { data: ex } = await sb.from('products').select('id').eq('client_id', CLIENT_ID).eq('name', p.name).single();
        if (!ex) {
           await sb.from('products').insert(p);
        }
      }
      console.log('Products inserted.');
    } else {
      console.log('Products file not found at:', productsFile);
    }
    
    // 2. Parse Remarketing Leads
    console.log('Parsing leads...');
    const leadsFile = 'C:\\Users\\eliza\\Downloads\\LIST DIF 1.xlsx';
    if (fs.existsSync(leadsFile)) {
      const wb = xlsx.readFile(leadsFile);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      const leads = data.map(row => {
        const keys = Object.keys(row);
        const getVal = (search) => {
          const key = keys.find(k => k.toLowerCase().includes(search));
          return key ? row[key] : null;
        };
        
        const name = getVal('nombre') || 'Cliente';
        let phone = getVal('numero') || getVal('tel') || '';
        phone = String(phone).replace(/\D/g, '');
        
        return {
          client_id: CLIENT_ID,
          full_name: String(name).trim(),
          phone: phone,
          last_purchase_date: new Date().toISOString(),
          status: 'pending'
        };
      }).filter(l => l.phone.length > 7);
      
      console.log(`Found ${leads.length} leads. Inserting...`);
      for (const l of leads) {
        const { data: ex } = await sb.from('remarketing_leads').select('id').eq('client_id', CLIENT_ID).eq('phone', l.phone).single();
        if (!ex) {
           await sb.from('remarketing_leads').insert(l);
        }
      }
      console.log('Leads inserted.');
    } else {
      console.log('Leads file not found at:', leadsFile);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
