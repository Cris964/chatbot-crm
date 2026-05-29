async function testNaturelFinal() {
    const token = 'EAAhtZAVUQmSMBQ4X1txesx1kyTODr4QuDhE3At7gYuZCshKKRuJ9TW8X1ZC6Y5iPRKNHqZAdyw6DA1FNe2Jtr8NsZCpIwZC9wZC7lElsGpZApWsIWSg7UXZCKCyUyRZB967YQMPD5qMAmDrWu6aLNDzWbFlo0Gp8j9YlZCdTJvMhIndq4y5wgxTttDsagN368WF5aVr7wZDZD';
    const to = '573163799745';
    
    const ids = ['1033194656544690', '127350207278890'];

    for (const phoneId of ids) {
        console.log(`Testing ID: ${phoneId}...`);
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
                text: { body: `Naturel Test Final with ID ${phoneId}` }
            })
        });

        const data = await response.json();
        console.log(`Response for ${phoneId}:`, data);
    }
}

testNaturelFinal();
