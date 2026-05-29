async function testTrazzosNewest() {
    const token = 'EAASr9DekULIBRkZCVZAl8rVZBWXC5HDDKgfAktZCHzCGf7EyHAwZAIv5qbQeZBJHzLK1jbc1hOZCicz3uPFc5NhzEch2btoxpGXVVsSYBZAUGUogGaZCo9ZAds9x9C67ZB8hmq9viVlysD18WWc7wZAHFRblJiVDh0a4qWZB8er94GZBCb0GPaMUKBTflqOXdZAjeSeaOIKGZBwlzgZBYwmgXoiJIfpCJ6fNOZBq7qpQxzBF19NSuWR5kZAZAvXE5jKlyjheMH9MQZBNga3YqROQZCbgRFTxsOnsQvhlkChSHPY05g1moJtgZDZD';
    const phoneId = '1118533531348913';
    const to = '573163799745';

    console.log("Testing Trazzos with NEWEST token...");
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
            text: { body: 'Trazzos: Token V4 reactivado! 😊🏗️' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testTrazzosNewest();
