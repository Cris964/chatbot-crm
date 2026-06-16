import dotenv from 'dotenv';

dotenv.config({ path: '.env.vercel.local' });

async function run() {
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const mimeType = "image/png";

    const messages = [
        {
            role: "user",
            content: [
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                { type: "text", text: "¿Qué ves en esta imagen? Responde en 10 palabras o menos." }
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
                max_tokens: 100
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log("Success:", data.choices[0].message.content);
        } else {
            console.error("Error from OpenRouter:", data);
        }
    } catch (e) {
        console.error("Network Error:", e.message);
    }
}
run();
