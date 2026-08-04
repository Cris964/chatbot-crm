const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const clientId = 'c91119cc-5451-4a64-b0e8-6b53d33d5563';
const WHATSAPP_TOKEN = 'EAAaOc5He5rgBSO9v1udvIus2Bi2LyqOAVt5RLcVhD01oNVUD23o08GDBlqgVeEdDnhAfbBR8ZAEkAcfCheJZAaU9swboF5DBD3m56aHV0ov4oR6Lc4xEMFyZA2wwa2Ww5YiAAcC83LgJnqhx9QfhgGtalwsv3H058xv31oBZAiGm9idpnunR64kC504fygZDZD';
const PHONE_NUMBER_ID = '1260814113781498';

const messageText = `¡Hola, buenas tardes, queridos clientes! 💖

Queremos compartirles una información muy importante.

Hemos implementado un nuevo sistema operativo para brindarles una mejor atención. Debido a este cambio, a algunos clientes les aparece como si nuestra línea de WhatsApp no estuviera disponible.

Si ese es tu caso, solo debes eliminar nuestro contacto y volver a agregarlo. De esta manera, la línea volverá a aparecer activa y podrás comunicarte con nosotros sin inconvenientes.

Les pedimos un poco de paciencia mientras terminamos de adaptar este nuevo sistema. Como todo cambio, requiere un proceso, pero estamos seguros de que nos ayudará a ofrecerles un servicio mucho más ágil y eficiente.

💖 Gracias por acompañarnos, por su comprensión y, sobre todo, por la confianza que siempre depositan en nosotros.

Daniela
Líder Digital`;

async function run() {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, user_phone, messages')
    .eq('client_id', clientId);
    
  if (error) {
    console.error('Error fetching conversations:', error);
    return;
  }
  
  const now = new Date();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let sentCount = 0;

  for (const conv of convs) {
    if (!conv.messages || !Array.isArray(conv.messages)) continue;
    
    // Check if the user replied within the last 24 hours
    let hasRecentUserMsg = false;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
        const msg = conv.messages[i];
        if (msg.role === 'user' && msg.timestamp) {
            const msgDate = new Date(msg.timestamp);
            if (now - msgDate < ONE_DAY) {
                hasRecentUserMsg = true;
                break;
            }
        }
    }
    
    if (hasRecentUserMsg) {
        console.log(`Sending to ${conv.user_phone}...`);
        
        // 1. Send via WhatsApp API
        const payload = {
            messaging_product: 'whatsapp',
            to: conv.user_phone,
            type: 'text',
            text: { body: messageText }
        };
        
        try {
            const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // 2. Log to CRM
                const newMsgNode = {
                    role: 'agent',
                    content: messageText,
                    timestamp: new Date().toISOString(),
                    sent_meta: [{ id: data.messages?.[0]?.id, type: 'text', content: messageText }]
                };
                
                await supabase.from('conversations').update({
                    messages: [...conv.messages, newMsgNode],
                    updated_at: new Date().toISOString()
                }).eq('id', conv.id);
                
                sentCount++;
                console.log(`Success: ${conv.user_phone}`);
            } else {
                console.error(`Failed for ${conv.user_phone}:`, data);
            }
            
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`Error sending to ${conv.user_phone}:`, e);
        }
    }
  }
  
  console.log(`Finished. Sent to ${sentCount} clients.`);
}

run();
