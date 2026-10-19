import fetch from 'node-fetch';

/**
 * Checks if a message contains payment keywords or image receipt
 */
export function mightBeSaleOrReceipt(text, hasImage) {
  if (hasImage) return true;
  if (!text || typeof text !== 'string') return false;

  const lower = text.toLowerCase();
  const paymentKeywords = [
    'comprobante', 'transferi', 'transferí', 'transferencia', 'transfiri', 'transfirió',
    'consigne', 'consigné', 'consignacion', 'consignación', 'pague', 'pagué', 'pago',
    'nequi', 'bancolombia', 'daviplata', 'transfiya', 'dale', 'abono',
    'cancelado', 'ya te envié', 'ya te envie', 'ya le envié', 'ya le envie',
    'ya transferí', 'ya transferi', 'ya pagué', 'ya pague', 'adjunto el pago',
    'datos de envio', 'datos de envío', 'datos para el envio', 'datos para el despacho',
    'para el envio', 'para el envío', 'direccion de envio', 'dirección de envío',
    'guia de envio', 'guía de envío', 'orden de compra', 'venta cerrada', 'confirmar pedido',
    'ya quedo', 'ya quedó', 'listo el pago', 'listo el envio', 'listo el envío',
    'ya consigne', 'ya consigné', 'ya envie el dinero', 'envié el dinero',
    'soporte de pago', 'soporte', 'recibo', 'recibo de pago', 'captura',
    'pantallazo', 'adjunto captura', 'adjunto soporte', 'ya lo pague', 'ya lo pagué',
    'pago confirmado', 'pago recibido', 'recibido el pago', 'transferencia exitosa'
  ];

  return paymentKeywords.some(kw => lower.includes(kw));
}

/**
 * Main detection function for incoming customer messages or receipts
 */
export async function detectAndProcessSale({
  supabase,
  clientId,
  conversationId,
  senderPhone,
  senderName,
  messageObj,
  textResponse,
  channel,
  openRouterKey,
  openAiKey
}) {
  const imageUrl = messageObj?._mediaUrl || (messageObj?.type === 'image' ? messageObj?.image?.url : null);
  const hasImage = !!imageUrl;
  const textToCheck = textResponse || messageObj?.text?.body || messageObj?.caption || '';

  if (!mightBeSaleOrReceipt(textToCheck, hasImage)) {
    return null;
  }

  console.log(`[SALE DETECTOR] Posible comprobante o venta detectada para ${senderPhone} (${clientId})`);

  // 1. Fetch recent conversation context (last 10 messages)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, messages, user_name')
    .eq('id', conversationId)
    .single();

  const messages = conv?.messages || [];
  const recentMsgs = messages.slice(-10).map(m => `${m.role === 'user' ? 'Cliente' : 'Asesor'}: ${m.content || ''}`).join('\n');

  // 2. Fetch active products for reference so the AI can match the exact product name and price
  const { data: products } = await supabase
    .from('products')
    .select('name, price, category')
    .eq('client_id', clientId)
    .eq('active', true)
    .limit(30);

  const productListStr = (products || []).map(p => `- ${p.name} ($${p.price})`).join('\n');

  // 3. Build prompt for AI Vision / Analysis
  const systemPrompt = `Eres un auditor inteligente de pagos y ventas para un CRM comercial (Activo Morrales / ecommerce).
Tu objetivo es analizar la conversación y/o la imagen adjunta para determinar si el cliente acaba de realizar un PAGO REAL o si se confirmó una VENTA / COMPRA válida.

Catálogo de productos de referencia:
${productListStr}

Reglas estrictas:
1. Si la imagen es un COMPROBANTE DE PAGO BANCARIO (Nequi, Bancolombia, Daviplata, Transfiya, Dale, etc.):
   - Extrae el valor pagado exacto en pesos colombianos (ej: 89000). Si la imagen muestra el valor, úsalo como prioritario.
   - Extrae el método de pago (Nequi, Bancolombia, Daviplata, etc.).
   - Identifica el producto o morral mencionado en el chat o en la nota.
   - Extrae ciudad y dirección de envío si el cliente las dio en el chat.
   - is_sale: true.

2. Si en el chat el cliente confirmó el pago explícitamente ("ya transferí los 89.000", "listo el pago de la maleta negra", etc.) o el asesor confirmó la venta ("pago confirmado", "recibido el comprobante"):
   - is_sale: true.
   - Extrae el monto numérico (total).

3. Si es solo una consulta (preguntando precio, enviando foto de un morral para consultar disponibilidad, pidiendo catálogo, etc.):
   - is_sale: false.

Responde ÚNICAMENTE un objeto JSON válido con este formato:
{
  "is_sale": true,
  "total": 89000,
  "product": "Nombre del morral o producto",
  "payment_method": "Nequi",
  "city": "Cali",
  "address": "Calle 10 # 5-20",
  "customer_name": "Nombre del cliente si está disponible",
  "notes": "Detalles breves"
}`;

  let userContent = [];
  if (imageUrl) {
    userContent.push({
      type: "text",
      text: `Analiza esta imagen adjunta (posible comprobante) junto con el historial de chat:\n\nHistorial reciente:\n${recentMsgs}\n\nÚltimo mensaje recibido: "${textToCheck}"`
    });
    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl }
    });
  } else {
    userContent.push({
      type: "text",
      text: `Analiza el historial de chat para verificar si se confirmó un pago/venta:\n\nHistorial reciente:\n${recentMsgs}\n\nÚltimo mensaje recibido: "${textToCheck}"`
    });
  }

  // 4. Call Model (prefer OpenRouter with openai/gpt-4o-mini or OpenAI direct)
  let resultJson = null;
  const apiKey = openRouterKey || process.env.OPENROUTER_API_KEY;
  const directOpenAiKey = openAiKey || process.env.OPENAI_API_KEY;

  try {
    let aiRes;
    if (apiKey) {
      aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nexuscrmia.vercel.app',
          'X-Title': 'NexusCRM Sale Detector'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });
    } else if (directOpenAiKey) {
      aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${directOpenAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });
    }

    if (aiRes && aiRes.ok) {
      const data = await aiRes.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        resultJson = JSON.parse(content);
      }
    } else if (aiRes) {
      const errText = await aiRes.text();
      console.error('[SALE DETECTOR AI API ERROR]', aiRes.status, errText);
    }
  } catch (err) {
    console.error('[SALE DETECTOR CALL ERROR]', err);
  }

  if (!resultJson || !resultJson.is_sale) {
    console.log('[SALE DETECTOR] No se determinó venta confirmada.');
    return null;
  }

  const saleAmount = parseInt(resultJson.total, 10) || 0;
  if (saleAmount <= 0) {
    console.log('[SALE DETECTOR] Venta detectada pero monto es 0 o inválido. Omitiendo.');
    return null;
  }

  const finalProduct = resultJson.product || 'Morral Activo';
  const finalName = resultJson.customer_name || conv?.user_name || senderName || 'Cliente';
  const paymentMethod = resultJson.payment_method || 'WhatsApp';
  const city = resultJson.city || 'N/A';
  const address = resultJson.address || 'N/A';

  // 5. Idempotency Check: Avoid duplicate order within 12 hours for the same phone & amount
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('id, total')
    .eq('client_id', clientId)
    .eq('user_phone', senderPhone)
    .gte('created_at', twelveHoursAgo)
    .limit(5);

  const isDuplicate = (existingOrders || []).some(o => Math.abs((o.total || 0) - saleAmount) < 100);
  if (isDuplicate) {
    console.log(`[SALE DETECTOR IDEMPOTENT] Ya existe orden reciente de $${saleAmount} para ${senderPhone}. Omitiendo duplicado.`);
    return null;
  }

  // 6. Insert into `orders`
  const { data: insertedOrder, error: orderErr } = await supabase
    .from('orders')
    .insert({
      client_id: clientId,
      user_phone: senderPhone,
      user_name: finalName,
      product: finalProduct,
      status: 'pagado',
      total: saleAmount,
      payment_method: paymentMethod,
      sale_type: 'Digital',
      city: city,
      address: address,
      invoice_url: imageUrl || null,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (orderErr) {
    console.error('[SALE DETECTOR ORDER INSERT ERROR]', orderErr);
    return null;
  }

  console.log(`[SALE DETECTOR ÉXITO] ¡Orden #${insertedOrder.id} creada por $${saleAmount} para ${finalName}!`);

  // 7. Update `leads` (Pipeline) to 'Venta Cerrada' (Ganado)
  try {
    let leadQuery = supabase.from('leads').select('id, value').eq('client_id', clientId);
    if (senderPhone && finalName) {
      leadQuery = leadQuery.or(`phone.eq.${senderPhone},name.eq.${finalName}`);
    } else if (senderPhone) {
      leadQuery = leadQuery.eq('phone', senderPhone);
    } else if (finalName) {
      leadQuery = leadQuery.eq('name', finalName);
    }

    const { data: existingLeads } = await leadQuery;

    if (existingLeads && existingLeads.length > 0) {
      const lead = existingLeads[0];
      const currentVal = parseInt(String(lead.value).replace(/[^0-9]/g, '')) || 0;
      await supabase.from('leads').update({
        stage: 'Venta Cerrada',
        score: 100,
        value: String(currentVal + saleAmount),
        company: finalProduct
      }).eq('id', lead.id);
    } else {
      await supabase.from('leads').insert({
        client_id: clientId,
        phone: senderPhone,
        name: finalName,
        stage: 'Venta Cerrada',
        score: 100,
        value: String(saleAmount),
        company: finalProduct,
        source: channel === 'whatsapp' ? 'WhatsApp' : channel === 'messenger' ? 'Messenger' : channel === 'instagram' ? 'Instagram' : 'Digital',
        status: 'active'
      });
    }
  } catch (leadErr) {
    console.error('[SALE DETECTOR LEAD SYNC ERROR]', leadErr);
  }

  // 8. Create notification
  try {
    await supabase.from('notifications').insert({
      client_id: clientId,
      conversation_id: conversationId,
      message: `🎉 Venta detectada automáticamente por IA: $${saleAmount.toLocaleString('es-CO')} - ${finalProduct} (${finalName})`,
      type: 'sale'
    });
  } catch (notifErr) {
    console.error('[SALE DETECTOR NOTIF ERROR]', notifErr);
  }

  // 9. Add subtle system confirmation in conversation messages
  try {
    const { data: latestConv } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
    if (latestConv) {
      const systemMsg = {
        role: 'agent',
        content: `🤖 [SISTEMA: Venta de $${saleAmount.toLocaleString('es-CO')} (${finalProduct}) detectada por IA y registrada automáticamente en Ventas y Pipeline Ganado]`,
        timestamp: new Date().toISOString()
      };
      await supabase.from('conversations').update({
        messages: [...(latestConv.messages || []), systemMsg],
        updated_at: new Date().toISOString()
      }).eq('id', conversationId);
    }
  } catch (convErr) {
    console.error('[SALE DETECTOR CONV NOTE ERROR]', convErr);
  }

  return {
    orderId: insertedOrder.id,
    total: saleAmount,
    product: finalProduct
  };
}
