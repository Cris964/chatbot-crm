const fs = require('fs');
let content = fs.readFileSync('api/webhook.js', 'utf8');

const anchor = '// Enviar a WhatsApp / Messenger / Instagram';
const anchorIndex = content.indexOf(anchor);

if (anchorIndex === -1) throw new Error('Anchor not found');

const cleanBottom = `// Enviar a WhatsApp / Messenger / Instagram
      const WHATSAPP_TOKEN = clients[0]?.whatsapp_token || process.env.WHATSAPP_TOKEN;
      const PHONE_NUMBER_ID = clients[0]?.phone_number_id || process.env.PHONE_NUMBER_ID;
      const FB_TOKEN = clients[0]?.facebook_access_token;

      for (const msg of messageQueue) {
          if (channel === 'whatsapp' && WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
              if (msg.type === 'text') {
                  await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messaging_product: 'whatsapp', to: senderPhone, type: 'text', text: { body: msg.content } })
                  }).then(async r => {
                      if (!r.ok) {
                          const errData = await r.json();
                          console.error('[WHATSAPP TEXT ERROR]', errData);
                      }
                  });
              } else if (msg.type === 'image' || msg.type === 'video') {
                  const payload = { messaging_product: 'whatsapp', to: senderPhone, type: msg.type };
                  payload[msg.type] = { link: msg.content };
                  
                  await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  }).then(async res => {
                    if (!res.ok) {
                        const errData = await res.json();
                        console.error(\`[WHATSAPP \${msg.type.toUpperCase()} ERROR]\`, errData);
                        await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                            method: 'POST',
                            headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: 'whatsapp', to: senderPhone, type: 'text', text: { body: \`*(Error de sistema: No se pudo cargar el archivo multimedia)*\` } })
                        });
                    }
                  }).catch(e => console.error('Media send error', e));
              }
          } else if ((channel === 'messenger' || channel === 'instagram') && FB_TOKEN) {
              let payload = { recipient: { id: senderPhone }, message: {} };
              if (msg.type === 'text') {
                  payload.message.text = msg.content;
              } else if (msg.type === 'image' || msg.type === 'video') {
                  payload.message.attachment = {
                      type: msg.type,
                      payload: { url: msg.content, is_reusable: true }
                  };
              }
              
              await fetch(\`https://graph.facebook.com/v21.0/me/messages?access_token=\${FB_TOKEN}\`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              }).then(async r => {
                  if (!r.ok) {
                      const errData = await r.json();
                      console.error(\`[\${channel.toUpperCase()} SEND ERROR]\`, errData);
                  }
              }).catch(e => console.error('FB Media send error', e));
          }
          
          await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  return res.status(200).send('EVENT_RECEIVED');

} catch (error) {
  console.error('[FATAL WEBHOOK ERROR]', error);
  return res.status(500).json({ error: 'Internal logic fail', details: error.message, stack: error.stack });
}
}

return res.status(405).send('Method Not Allowed');
}
`;

content = content.substring(0, anchorIndex) + cleanBottom;
fs.writeFileSync('api/webhook.js', content);
console.log('Fixed webhook.js');
