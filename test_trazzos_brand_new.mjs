async function testTrazzosBrandNew() {
    const token = 'EAA4qzHxUJVEBRadEnIlqOOwk7ZAZAuZChOhyytbHyi4egN5jJ0O6ZAKZAVd52Dz0nFeTqOo6CrEqnZA1PF2KOMs0NBaZCSOupIjsXumvozkMiFOwHy0ZBZBXetLG9R1xIL9afdUwGl5y4GjxRaswi7dNNrKQry5UXRmBaQq5TSrlT38qtd88yyFg9QwLrsDBgZCwt2P2hAoBZBJFRnHbU9OEO5e7919wF145nm9RfIh6asSajx09kDJSwqqZBwudlVW6N4MRi723uhWpmNIp5N4PrrG9iVqg6ZBDFXHkDlZAZAWGAZDZD';
    const phoneId = '1131600676705092';
    const to = '573163799745';

    console.log("Testing Trazzos BRAND NEW test number...");
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
            text: { body: 'Trazzos está ONLINE en el nuevo número 🚀' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testTrazzosBrandNew();
