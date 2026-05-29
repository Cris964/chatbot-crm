async function testTrazzosFinalV2() {
    const token = 'EAASr9DekULIBRTDcvsYqA6i9yuoj8OiR0ZCvsZBopBsTekPVh0XmJUw6WZBzSv2mGS5Bm3tKkz1j8qJhZCBXz67jzW60BiWJ0iQxb7ZBXHdlHUQzakZCmziBqlew3oLwRKqOV1OziWnUJKQYQZABi9jDaw2b46I4yfVgZAj82Cf76UVugW2wD3dQGZAJFB6CKgTjBUP5C1ZBPwAi1QPocafzHRJ7rQbi4RzwGsWVNYGzns2cZAEuJBYWmjmwQAwZB4t3hlUejMAyDgevUKSX8SFL5i2cdZAReMjCmN4nFrKNEXQZDZD';
    const phoneId = '1118533531348913';
    const to = '573163799745';

    console.log("Testing Trazzos with NEW permanent-looking token...");
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
            text: { body: 'Trazzos: ¡Estamos en línea! 🏗️📐' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testTrazzosFinalV2();
