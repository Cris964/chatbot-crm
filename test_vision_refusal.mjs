import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });

async function run() {
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const mimeType = "image/png";

    const messages = [
        {
            role: "system",
            content: "Eres Sara, asesora comercial de Ladrillera La Samaritana. Solo vendes ladrillos."
        },
        {
            role: "user",
            content: [
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                { type: "text", text: "Analiza esta imagen enviada por el cliente y responde de forma natural de acuerdo a tu rol comercial y a los productos que vendes. Si reconoces algún producto de tu catálogo, dilo y asesóralo." }
            ]
        }
    ];

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages,
                max_tokens: 150
            })
        });
        const data = await response.json();
        console.log("Response:", data.choices[0]?.message?.content);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
