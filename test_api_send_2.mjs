import fetch from 'node-fetch';

async function test() {
  const payload = {
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "573000000000",
            "id": "wamid.12345",
            "type": "text",
            "text": { "body": "Hola simulador Vercel" }
          }],
          "metadata": { "phone_number_id": "1033194656544690" },
          "contacts": [{ "profile": { "name": "Test" } }]
        }
      }]
    }]
  };

  const res = await fetch('https://nexuscrmia.vercel.app/api/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

test();
