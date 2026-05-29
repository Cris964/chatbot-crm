// Native fetch used

async function testWhatsApp() {
    const token = 'EAAUxBNup6IYBRc0VvtqDEdiK5pZBcl6gC4BTk5t2icJMqZBIDOPoqTtfiMZARcb7ubJE3Q1tZBXuIWMrRKODJ3EZA7yZBz18EHpmaCxZAsurNgZCoFhy4QJWBkJ4dfA0xHjXif74ig8UqZAmqJZBMoscTSR7Wl8JDZBVHWo8jIfF85ODXfdZC5ZCZB2m5ACMt7jRF1YhZBJ7mCrwZANpGRHyjA5OCqm0sHgHwLBg454s0Seo8M8dBj930Pqb2sT27kshOTrwTQgLvUBhxHh5rHIl5reEE82FrDyqv2OwZC9LVihW6kgZDZD';
    const phoneId = '1074951269024593';
    const to = '573163799745';

    console.log("Testing WhatsApp API send...");
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
            text: { body: 'Mensaje de prueba desde el sistema (Antigravity)' }
        })
    });

    const data = await response.json();
    console.log("WhatsApp API Response:", data);
}

testWhatsApp();
