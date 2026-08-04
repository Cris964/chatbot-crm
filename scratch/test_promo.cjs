const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const WHATSAPP_TOKEN = 'EAAaOc5He5rgBSO9v1udvIus2Bi2LyqOAVt5RLcVhD01oNVUD23o08GDBlqgVeEdDnhAfbBR8ZAEkAcfCheJZAaU9swboF5DBD3m56aHV0ov4oR6Lc4xEMFyZA2wwa2Ww5YiAAcC83LgJnqhx9QfhgGtalwsv3H058xv31oBZAiGm9idpnunR64kC504fygZDZD';
const PHONE_NUMBER_ID = '1260814113781498';

async function run() {
  const cleanPhone = '573165832878';
  
  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: "promo_diaria",
      language: { code: "es" },
      components: []
    }
  };
  
  // Add image header
  payload.template.components.push({
    type: "header",
    parameters: [
      {
        type: "image",
        image: { link: "https://hubfblqndyqndmxtnshc.supabase.co/storage/v1/object/public/whatsapp_media/1722723049079_WhatsAppImage20260803at4.54.43PM.jpeg" }
      }
    ]
  });
  
  // Add body text variable
  payload.template.components.push({
    type: "body",
    parameters: [
      {
        type: "text",
        text: "¡Elige tu color favorito y llévate un morral con excelente calidad al mejor precio! Escríbenos para más información y separa el tuyo."
      }
    ]
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

run();
