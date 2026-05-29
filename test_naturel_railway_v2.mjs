async function testNaturelRailwayID() {
    const token = 'EAAhtZAVUQmSMBQ4X1txesx1kyTODr4QuDhE3At7gYuZCshKKRuJ9TW8X1ZC6Y5iPRKNHqZAdyw6DA1FNe2Jtr8NsZCpIwZC9wZC7lElsGpZApWsIWSg7UXZCKCyUyRZB967YQMPD5qMAmDrWu6aLNDzWbFlo0Gp8j9YlZCdTJvMhIndq4y5wgxTttDsagN368WF5aVr7wZDZD';
    const phoneId = '127350207278890'; // FROM RAILWAY SCREENSHOT
    const to = '573163799745';

    console.log("Testing Naturel with RAILWAY ID and Token...");
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: 'Naturel: Prueba con ID 1273... (Railway)' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testNaturelRailwayID();
