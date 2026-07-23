const payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1087666263823022",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551677778",
              "phone_number_id": "1170813859456622"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Cristian Caicedo"
                },
                "wa_id": "573163799745",
                "user_id": "CO.1372889571575620",
                "country_code": "CO"
              }
            ],
            "messages": [
              {
                "from": "573163799745",
                "from_user_id": "CO.1372889571575620",
                "id": "wamid.TEST_ID_" + Date.now(),
                "timestamp": "1784701194",
                "text": {
                  "body": "Hola simulado"
                },
                "from_logical_id": "264269555851436",
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
};

async function test() {
  console.log("Sending simulated webhook...");
  try {
    const res = await fetch('https://nexuscrmia.vercel.app/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
