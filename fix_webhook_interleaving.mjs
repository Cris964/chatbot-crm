import fs from 'fs';

let content = fs.readFileSync('api/webhook.js', 'utf8');

const regexToReplace = /\/\/ Find all image URLs using global regex[\s\S]*?\/\/\s*Enviar a WhatsApp/gi;

const replacement = `                        // Message Interleaving Logic (Text -> Image -> Text)
                        const messageQueue = [];
                        const extractionRegex = /(\\[SEND_IMAGE:\\s*(https?:\\/\\/[^\\]]+)\\]|\\[.*?\\]\\((https?:\\/\\/.*?supabase\\.co\\/storage.*?)\\))/gi;
                        let lastIndex = 0;
                        let extractionMatch;

                        const cleanText = (text) => text.replace(/\\[NEEDS_HUMAN(?:\\s*:.*?)?\\]/gi, '')
                                                        .replace(/\\[SALE_CONFIRMED: .*?\\]/gi, '')
                                                        .replace(/\\[LEAD_STATE:.*?\\]/gi, '')
                                                        .replace(/\\[CITA_AGENDADA(?:\\s*:.*?)?\\]/gi, '')
                                                        .trim();

                        while ((extractionMatch = extractionRegex.exec(botReplyText)) !== null) {
                            let textBefore = botReplyText.slice(lastIndex, extractionMatch.index);
                            textBefore = cleanText(textBefore);
                            if (textBefore) {
                                messageQueue.push({ type: 'text', content: textBefore });
                            }

                            let url = (extractionMatch[2] || extractionMatch[3]).trim();
                            let finalImgUrl = url;
                            if (url.toLowerCase().endsWith('.webp')) {
                                finalImgUrl = \`https://images.weserv.nl/?url=\${encodeURIComponent(url)}&output=jpg\`;
                            }
                            messageQueue.push({ type: 'image', content: finalImgUrl });
                            lastIndex = extractionRegex.lastIndex;
                        }

                        let textAfter = botReplyText.slice(lastIndex);
                        textAfter = cleanText(textAfter);
                        if (textAfter) {
                            messageQueue.push({ type: 'text', content: textAfter });
                        }

                        // Actualizar Lead Pipeline
                        let stage = 'Contactado';
                        let score = 10;
                        if (leadStateMatch) {
                             stage = leadStateMatch[1].trim();
                             score = parseInt(leadStateMatch[2]);
                        }
                        if (saleMatch) {
                             stage = 'Venta Cerrada';
                             score = 100;
                        }

                        try {
                             const { data: existingLead } = await supabase.from('leads').select('id').eq('client_id', clientId).eq('phone', senderPhone).single();
                             if (existingLead) {
                                  await supabase.from('leads').update({ stage, score, name: senderName }).eq('id', existingLead.id);
                             } else {
                                  await supabase.from('leads').insert([{
                                       client_id: clientId,
                                       phone: senderPhone,
                                       name: senderName,
                                       stage,
                                       score,
                                       source: 'WhatsApp',
                                       value: '$0'
                                  }]);
                             }
                        } catch(e) { console.error('Lead error', e) }

                        // Asignación a Ventas o Departamentos Específicos
                        let assignedUserId = null;
                        if (humanDept === 'CREARTE') {
                             assignedUserId = '096b5cb3-9754-4581-be3c-d6c2a64caead'; // Crearte Admin UUID
                        } else if (humanDept === 'ASESOR') {
                             assignedUserId = '2db217bc-c72e-448a-9a8d-4b2469c93661'; // Asesor UUID
                        } else if (saleMatch) {
                             const { data: vends } = await supabase.from('team_members').select('user_id').eq('client_id', clientId).eq('role', 'vendedor').eq('status', 'activo').limit(1);
                             if (vends && vends.length > 0) assignedUserId = vends[0].user_id;
                        }

                        // Guardar en CRM
                        const cleanReplyForDB = cleanText(botReplyText).replace(/\\[.*?\\]\\((https?:\\/\\/.*?supabase\\.co\\/storage.*?)\\)/gi, '');
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        let updatePayload = {
                            messages: [...(latest?.messages || []), { role: 'agent', content: cleanReplyForDB, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString(),
                            needs_human: needsHuman
                        };
                        if (assignedUserId) {
                             updatePayload.assigned_to = assignedUserId;
                        }

                        await supabase.from('conversations').update(updatePayload).eq('id', conversationId);

                        // Crear Notificación si necesita humano
                        if (needsHuman) {
                          let notifMsg = \`Intervención requerida para \${senderName}\`;
                          if (humanDept) notifMsg += \` (Área: \${humanDept})\`;
                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: notifMsg,
                            type: 'escalation'
                          }]);
                        }
                        
                        // Notificación de Cita y Registro
                        if (citaMatch) {
                          const appointmentDateStr = citaMatch[1] ? citaMatch[1].trim() : null;
                          let msg = \`Nueva cita agendada con \${senderName}\`;
                          if (appointmentDateStr) msg += \` para el \${appointmentDateStr}\`;

                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: msg,
                            type: 'appointment'
                          }]);

                          if (appointmentDateStr) {
                             try {
                               const parsedDate = new Date(appointmentDateStr);
                               if (!isNaN(parsedDate)) {
                                  await supabase.from('appointments').insert([{
                                     client_id: clientId,
                                     title: \`Cita de Remodelación/Asesoría\`,
                                     date: parsedDate.toISOString().split('T')[0],
                                     time: parsedDate.toISOString().split('T')[1].slice(0,5),
                                     contact_name: senderName,
                                     contact_phone: senderPhone,
                                     department: humanDept === 'CREARTE' ? 'Crearte' : 'Trazzos',
                                     status: 'Confirmed'
                                  }]);
                                }
                             } catch(err) {
                               console.error("Error parsing appointment date", err);
                             }
                          }
                        }

                        // Descontar Stock si hay venta y Notificar
                        if (saleMatch && saleMatch[1]) {
                          const productName = saleMatch[1].trim();
                          
                          await supabase.from('notifications').insert([{
                            client_id: clientId,
                            conversation_id: conversationId,
                            message: \`Venta cerrada: \${productName} a \${senderName}\`,
                            type: 'sale'
                          }]);

                          const { data: prod } = await supabase
                            .from('products')
                            .select('id, stock')
                            .eq('client_id', clientId)
                            .ilike('name', \`%\${productName}%\`)
                            .limit(1)
                            .single();
                          
                          if (prod && prod.stock > 0) {
                            await supabase.from('products').update({ stock: prod.stock - 1 }).eq('id', prod.id);
                          }
                        }

                        // Enviar a WhatsApp`;

if (content.match(regexToReplace)) {
    content = content.replace(regexToReplace, replacement);
    fs.writeFileSync('api/webhook.js', content);
    console.log('✅ Updated splitting logic');
} else {
    console.log('❌ Could not find block 1');
}

// 2. Replace the actual sending block
const sendingBlockRegex = /if \(WHATSAPP_TOKEN && PHONE_NUMBER_ID\) \{[\s\S]*?\}\s*\}\s*\}\s*else \{/gi;

const sendingReplacement = `if (WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
                            for (const msg of messageQueue) {
                                if (msg.type === 'text') {
                                    await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                                      method: 'POST',
                                      headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        messaging_product: 'whatsapp',
                                        to: senderPhone,
                                        type: 'text',
                                        text: { body: msg.content }
                                      })
                                    }).then(async r => {
                                        if (!r.ok) {
                                            const errData = await r.json();
                                            console.error('[WHATSAPP TEXT ERROR]', errData);
                                        }
                                    });
                                } else if (msg.type === 'image') {
                                    await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                                      method: 'POST',
                                      headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        messaging_product: 'whatsapp',
                                        to: senderPhone,
                                        type: 'image',
                                        image: { link: msg.content }
                                      })
                                    }).then(async imgRes => {
                                      if (!imgRes.ok) {
                                          const imgErr = await imgRes.json();
                                          console.error('[WHATSAPP IMAGE ERROR]', imgErr);
                                          await fetch(\`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`, {
                                              method: 'POST',
                                              headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                messaging_product: 'whatsapp',
                                                to: senderPhone,
                                                type: 'text',
                                                text: { body: "*(Error de sistema: No se pudo cargar la imagen)*" }
                                              })
                                          });
                                      }
                                    }).catch(e => console.error("Image send error", e));
                                }
                                // Ensure strict sequential delivery
                                await new Promise(r => setTimeout(r, 600));
                            }
                        }
                    }
                } else {`;

if (content.match(sendingBlockRegex)) {
    content = content.replace(sendingBlockRegex, sendingReplacement);
    fs.writeFileSync('api/webhook.js', content);
    console.log('✅ Updated sending loop logic');
} else {
    console.log('❌ Could not find sending block');
}
