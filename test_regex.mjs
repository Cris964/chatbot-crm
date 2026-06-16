const mimeType = 'image/jpeg';
const base64Image = 'base64string123456';
const userMessage = `[IMAGEN_CLIENTE:${mimeType};base64,${base64Image}] El cliente envió esta imagen. Analízala y responde de forma natural: si es un producto nuestro confirma cuál es, si es una foto personal salúdalo, si es algo relacionado con salud ofrece ayuda con nuestros productos.`;

const match = userMessage.match(/\[IMAGEN_CLIENTE:([^;]+);base64,(.+)\]/s);

if (match) {
    console.log("Match found!");
    console.log("MimeType:", match[1]);
    console.log("Base64:", match[2]);
} else {
    console.log("No match found!");
}
