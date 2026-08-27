const fs = require('fs');
let code = fs.readFileSync('api/send.js', 'utf8');

const regex1 = /metaPayload\.image = \{ link: message \};/;
if (code.match(regex1)) {
    code = code.replace(regex1, `let finalImageUrl = message;
            if (finalImageUrl.toLowerCase().includes('.webp')) {
                finalImageUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(finalImageUrl) + '&output=jpg';
            }
            metaPayload.image = { link: finalImageUrl };`);
}

const regex2 = /payload: \{ url: message, is_reusable: true \}/;
if (code.match(regex2)) {
    code = code.replace(regex2, `payload: { url: (msgType === 'image' && message.toLowerCase().includes('.webp')) ? 'https://wsrv.nl/?url=' + encodeURIComponent(message) + '&output=jpg' : message, is_reusable: true }`);
}

fs.writeFileSync('api/send.js', code);
console.log("Patched successfully");
