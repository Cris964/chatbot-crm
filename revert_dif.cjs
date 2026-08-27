const fs = require('fs');
let code = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /content:\s*'CRÍTICO Y OBLIGATORIO: El usuario acaba de responder de forma POSITIVA a una \[DIFUSION\]. OMITE COMPLETAMENTE TU SALUDO INICIAL LARGO. RESPONDE ÚNICAMENTE CON ESTA FRASE EXACTA: "📸🥰 ¿Quieres que te comparta más foticos de esta referencia para que puedas verla mejor\? ✨🎒" SEGUIDO INMEDIATAMENTE POR LAS ETIQUETAS DE IMÁGENES DE \[PROMO_ACTUAL\].'/;

if (code.match(regex)) {
    code = code.replace(regex, 'content: \'CRÍTICO Y OBLIGATORIO: El usuario acaba de responder de forma POSITIVA a una [DIFUSION]. OMITE COMPLETAMENTE TU SALUDO INICIAL LARGO. RESPONDE ÚNICAMENTE CON UNA FRASE CORTA Y NATURAL (ej. "¡Claro que sí! Mira las fotos:") SEGUIDO INMEDIATAMENTE POR LAS ETIQUETAS DE IMÁGENES DE [PROMO_ACTUAL]. NO HAGAS PREGUNTAS NI MUESTRES EL MENÚ.\'');
    fs.writeFileSync('api/_aiHelper.js', code);
    console.log('Reverted AI reply successfully!');
} else {
    console.log('Could not find regex to revert.');
}
