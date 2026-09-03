const fs = require('fs');

let code = fs.readFileSync('api/send.js', 'utf8');

const replacement = `    const aiContextUrls = record.aiContextUrls || [];
    if (aiContextUrls && aiContextUrls.length > 0) {
      const { data: existingConv } = await supabase.from('conversations').select('id, messages').eq('client_id', clientId).eq('user_phone', phone).single();
      const systemMemo = {
        role: 'assistant',
        content: \`[SISTEMA INTERNO]: Acabas de enviarle al cliente una campaña promocional por difusión con las siguientes fotos: \${aiContextUrls.join(', ')}. CRÍTICO Y OBLIGATORIO: Si el usuario responde de forma POSITIVA o muestra interés a esta difusión, OMITE COMPLETAMENTE TU SALUDO INICIAL LARGO. RESPONDE ÚNICAMENTE CON UNA FRASE CORTA Y NATURAL (ej. "¡Claro que sí! Mira las fotos:") SEGUIDA INMEDIATAMENTE de las ETIQUETAS DE IMÁGENES de la promoción. FINALMENTE INCLUYE LA ETIQUETA [NEEDS_HUMAN].\`,
        timestamp: new Date().toISOString()
      };
      
      if (existingConv) {
          const updatedMessages = [...(existingConv.messages || []), systemMemo];
          await supabase.from('conversations').update({ messages: updatedMessages, needs_human: false }).eq('id', existingConv.id);
      } else {
          await supabase.from('conversations').insert([{
              client_id: clientId,
              user_phone: phone,
              user_name: record.user_name || 'Cliente',
              messages: [systemMemo],
              needs_human: false
          }]);
      }
    }`;

code = code.replace(/const aiContextUrls = record\.aiContextUrls \|\| \[\];\s*if \(aiContextUrls && aiContextUrls\.length > 0\) \{[\s\S]*?\}\s*\}/, replacement);

fs.writeFileSync('api/send.js', code);
console.log('patched send.js');
