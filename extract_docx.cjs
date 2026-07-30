const mammoth = require("mammoth");
const fs = require("fs");

const filePath = 'C:\\Users\\eliza\\Downloads\\PLANTILLA DE RESPUESTAS oficial (1).docx';

mammoth.extractRawText({path: filePath})
    .then(function(result){
        const text = result.value; // The raw text
        const messages = result.messages;
        fs.writeFileSync("activos_plantilla.txt", text);
        console.log("Successfully extracted text. Length:", text.length);
    })
    .catch(function(error) {
        console.error(error);
    });
