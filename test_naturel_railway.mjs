async function testNaturelRailway() {
    const token = 'EAAhLZAVUQmSMBQ4X1lxesx1ky1QDr4QuDhE3AL/gYuZCshKKRuJ9TWBX1ZC6Y5iPRKNIiqZAdyw6DA1fNe2JTrBNsZCPiWZC9wZC71FlSgp7ApWsTWsg7UX7CKCyllyR7B967YQMPD5qMaMDrWu6alNDzWbFiOO8p8j9Y1ZCdlJvMhIndq4ySwgxiltDSagN368WF5aVr7wZDZD';
    const phoneId = '127350207278890';
    const to = '573163799745';

    console.log("Testing Naturel with Railway ID...");
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
            text: { body: 'Naturel está vivo? 🌿' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testNaturelRailway();
