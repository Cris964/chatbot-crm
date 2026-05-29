// Global fetch used

async function testTrazzos() {
    const token = 'EAAUxBNup6IYBRSf7TCJtZBZA5Oj9mCxau1I6MksLQZBvnhqK824iVmss8BRaoKAkTg30TubchA9yZBve69k6qKvvNM3w1mE3cK9pNGpI0By5huZACvRy3JrLciyN2ZAe8mQdgAZCP1VJrtSZCUy05DvamPRwvdoCkHPdI8AZBxCt2bhUTkzhUkVdjrcsq7f5NKFn41wfuzKFRczZChQOwHjRLIMmWoKns4w814bDymXahfDgSScReRFxGxpTJeBS9RtqOzLtdMBMe6xztIzjai9sQljZClMmtwvuMzcH6DKd1urCgZDZD';
    const phoneId = '1074951269024593';
    const to = '573163799745';

    console.log("Testing Trazzos NEW Token...");
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
            text: { body: 'Trazzos está ONLINE 🚀' }
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testTrazzos();
