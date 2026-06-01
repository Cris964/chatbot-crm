import dotenv from 'dotenv';
dotenv.config();

async function testSend() {
  const payload = {
    client_id: '9dfc3da6-39df-41bb-ad81-e2f4769062de', // Naturel client ID (or I'll fetch it)
    phone: '573163799745', // Cristian's phone
    message: 'Prueba desde script',
    type: 'text'
  };

  try {
    const res = await fetch('https://nexuscrmia.vercel.app/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}

testSend();
