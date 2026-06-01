import re

with open('api/webhook.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Inventory Context / Prompt
old_prompt = r"SI EL CLIENTE CONFIRMA LA COMPRA DE UN PRODUCTO ESPECÍFICO, INCLUYE EL TAG '\[SALE_CONFIRMED: Nombre del Producto\]' AL FINAL\.\\n`;"
new_prompt = r"""SI EL CLIENTE CONFIRMA LA COMPRA DE UN PRODUCTO ESPECÍFICO, INCLUYE EL TAG '[SALE_CONFIRMED: Nombre del Producto]' AL FINAL.
ADEMÁS, EVALÚA LA INTENCIÓN DEL CLIENTE Y AÑADE ESTE TAG AL FINAL DE TU RESPUESTA:
[LEAD_STATE: Etapa | Score]
Donde Etapa es uno de: "Nuevo", "Contactado", "Interesado", "Negociación", "Venta Cerrada", "Venta Perdida".
Donde Score es un número del 1 al 100.\n`;"""

content = re.sub(old_prompt, new_prompt, content)

# 2. Extract Tags & Clean Reply
old_tags = r"""                        // Analizar Tags
                        const needsHuman = botReplyText\.includes\('\[NEEDS_HUMAN\]'\);
                        const saleMatch = botReplyText\.match\(/\\\[SALE_CONFIRMED: \(\.\*\?\)\\\]/\);
                        
                        let cleanReply = botReplyText\.replace\('\[NEEDS_HUMAN\]', ''\)\.replace\(/\\\[SALE_CONFIRMED: \.\*\?\\\]/, ''\)\.trim\(\);"""

new_tags = """                        // Analizar Tags
                        const needsHuman = botReplyText.includes('[NEEDS_HUMAN]');
                        const saleMatch = botReplyText.match(/\\[SALE_CONFIRMED: (.*?)\\]/);
                        const leadStateMatch = botReplyText.match(/\\[LEAD_STATE:\\s*(.*?)\\s*\\|\\s*(\\d+)\\]/i);
                        
                        let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').replace(/\\[SALE_CONFIRMED: .*?\\]/, '').replace(/\\[LEAD_STATE:.*?\\]/i, '').trim();

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
                        } catch(e) { console.error('Lead error', e) }"""

content = content.replace("""                        // Analizar Tags
                        const needsHuman = botReplyText.includes('[NEEDS_HUMAN]');
                        const saleMatch = botReplyText.match(/\\[SALE_CONFIRMED: (.*?)\\]/);
                        
                        let cleanReply = botReplyText.replace('[NEEDS_HUMAN]', '').replace(/\\[SALE_CONFIRMED: .*?\\]/, '').trim();""", new_tags)


# 3. Add auto-assignment logic
old_save = r"""                        // Guardar en CRM
                        const { data: latest } = await supabase\.from\('conversations'\)\.select\('messages'\)\.eq\('id', conversationId\)\.single\(\);
                        await supabase\.from\('conversations'\)\.update\({
                            messages: \[\.\.\.\(latest\?\.messages \|\| \[\]\), { role: 'agent', content: cleanReply, timestamp: new Date\(\)\.toISOString\(\) }\],
                            updated_at: new Date\(\)\.toISOString\(\),
                            needs_human: needsHuman
                        }\)\.eq\('id', conversationId\);"""

new_save = """                        // Asignación a Ventas
                        let assignedUserId = null;
                        if (saleMatch) {
                             const { data: vends } = await supabase.from('team_members').select('user_id').eq('client_id', clientId).eq('role', 'vendedor').eq('status', 'activo').limit(1);
                             if (vends && vends.length > 0) assignedUserId = vends[0].user_id;
                        }

                        // Guardar en CRM
                        const { data: latest } = await supabase.from('conversations').select('messages').eq('id', conversationId).single();
                        let updatePayload = {
                            messages: [...(latest?.messages || []), { role: 'agent', content: cleanReply, timestamp: new Date().toISOString() }],
                            updated_at: new Date().toISOString(),
                            needs_human: needsHuman
                        };
                        if (assignedUserId) {
                             updatePayload.assigned_to = assignedUserId;
                        }

                        await supabase.from('conversations').update(updatePayload).eq('id', conversationId);"""

content = re.sub(old_save, new_save, content)

with open('api/webhook.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("webhook.js patched")
