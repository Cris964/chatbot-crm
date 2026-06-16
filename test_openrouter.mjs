import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({path: '.env.vercel.local'});

async function test() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'Hola' }],
        max_tokens: 10
    })
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Body: ${text}`);
}

test();
