const fs = require('fs');

let aiHelper = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /const aiMessages = \[\s*\{ role: 'system', content: \`\$\{clientSetup\.prompt\}\\n\\n\[DATOS DEL CLIENTE ACTUAL: Nombre: \$\{senderName\}\]\\n\[FECHA Y HORA ACTUAL \(BOGOT[^\)]*\): \$\{new Date\(\)\.toLocaleString\("es-CO", \{ timeZone: "America\/Bogota" \}\)\}\]\\n\\n\$\{inventoryContext\}\` \},\s*\.\.\.finalMessages\.slice\(-30\)\.map\(m => \{/s;

// We need to inject a check for [DIFUSION] before aiMessages
const replacement = `
  // Check if the user is responding to a broadcast (DIFUSION)
  let isRespondingToDifusion = false;
  if (finalMessages.length >= 2) {
      const lastUserMsg = finalMessages[finalMessages.length - 1];
      const prevMsg = finalMessages[finalMessages.length - 2];
      if (lastUserMsg.role === 'user' && prevMsg.role === 'agent' && (prevMsg.content || '').includes('[DIFUSION]')) {
          const contentLower = (lastUserMsg.content || '').toLowerCase().trim();
          const positiveWords = ['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale'];
          if (positiveWords.some(w => contentLower.includes(w))) {
              isRespondingToDifusion = true;
          }
      }
  }

  const aiMessages = [
      { role: 'system', content: \`\$\{clientSetup.prompt\}\\n\\n[DATOS DEL CLIENTE ACTUAL: Nombre: \$\{senderName\}]\\n[FECHA Y HORA ACTUAL (BOGOTÁ): \$\{new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })\}]\\n\\n\$\{inventoryContext\}\` },
      ...(isRespondingToDifusion && companyProducts && companyProducts.some(p => p.name === 'PROMO_ACTUAL') ? [{
          role: 'system',
          content: 'CRÍTICO Y OBLIGATORIO: El usuario acaba de responder de forma POSITIVA a una [DIFUSION]. OMITE COMPLETAMENTE TU SALUDO INICIAL LARGO ("Hola, bienvenido al mundo de los morrales..."). RESPONDE ÚNICAMENTE CON UNA FRASE CORTA Y NATURAL (ej. "¡Claro que sí! Mira las fotos:") SEGUIDO INMEDIATAMENTE POR LAS ETIQUETAS DE IMÁGENES DE [PROMO_ACTUAL]. NO HAGAS PREGUNTAS NI MUESTRES EL MENÚ.'
      }] : []),
      ...finalMessages.slice(-30).map(m => {
`;

aiHelper = aiHelper.replace(regex, replacement);

fs.writeFileSync('api/_aiHelper.js', aiHelper);
console.log("Patched _aiHelper.js");
