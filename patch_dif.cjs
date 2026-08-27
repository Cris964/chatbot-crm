const fs = require('fs');
let code = fs.readFileSync('api/_aiHelper.js', 'utf8');

const strToFind = `content: 'CR?TICO Y OBLIGATORIO: El usuario acaba de responder de forma POSITIVA a una [DIFUSION]. OMITE 
COMPLETAMENTE TU SALUDO INICIAL LARGO ("Hola, bienvenido al mundo de los morrales..."). RESPONDE sNICAMENTE CON UNA 
FRASE CORTA Y NATURAL (ej. "Claro que s! Mira las fotos:") SEGUIDO INMEDIATAMENTE POR LAS ETIQUETAS DE IM?GENES DE 
[PROMO_ACTUAL]. NO HAGAS PREGUNTAS NI MUESTRES EL MENs.'`;

// We can just use a regex that ignores encoding corruption:
const blockRegex = /content:\s*'CR[^']*?POSITIVA a una \[DIFUSION\][^']*?'/;

if (code.match(blockRegex)) {
    code = code.replace(blockRegex, `content: 'CRÍTICO Y OBLIGATORIO: El usuario acaba de responder de forma POSITIVA a una [DIFUSION]. OMITE COMPLETAMENTE TU SALUDO INICIAL LARGO. RESPONDE ÚNICAMENTE CON ESTA FRASE EXACTA: "📸🥰 ¿Quieres que te comparta más foticos de esta referencia para que puedas verla mejor? ✨🎒" SEGUIDO INMEDIATAMENTE POR LAS ETIQUETAS DE IMÁGENES DE [PROMO_ACTUAL].'`);
    fs.writeFileSync('api/_aiHelper.js', code);
    console.log('Replaced successfully!');
} else {
    console.log('Could not find block');
}
