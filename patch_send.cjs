const fs = require('fs');
let code = fs.readFileSync('api/send.js', 'utf8');

const imgMatch = `        if (msgType === 'image') {
          metaPayload.type = 'image';
          metaPayload.image = { link: message };`;

const imgReplacement = `        if (msgType === 'image') {
          metaPayload.type = 'image';
          let finalImageUrl = message;
          if (finalImageUrl.toLowerCase().includes('.webp')) {
              finalImageUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(finalImageUrl) + '&output=jpg';
          }
          metaPayload.image = { link: finalImageUrl };`;

const igMatch = `        } else if (msgType === 'image' || msgType === 'video' || msgType === 'audio' || msgType === 'document') {
            metaPayload.message.attachment = {
                type: msgType === 'document' ? 'file' : msgType,
                payload: { url: message, is_reusable: true }
            };`;

const igReplacement = `        } else if (msgType === 'image' || msgType === 'video' || msgType === 'audio' || msgType === 'document') {
            let finalUrl = message;
            if (msgType === 'image' && finalUrl.toLowerCase().includes('.webp')) {
                finalUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(finalUrl) + '&output=jpg';
            }
            metaPayload.message.attachment = {
                type: msgType === 'document' ? 'file' : msgType,
                payload: { url: finalUrl, is_reusable: true }
            };`;

if (code.includes(imgMatch)) {
    code = code.replace(imgMatch, imgReplacement);
} else {
    console.log("Could not find imgMatch");
}

if (code.includes(igMatch)) {
    code = code.replace(igMatch, igReplacement);
} else {
    console.log("Could not find igMatch");
}

fs.writeFileSync('api/send.js', code);
console.log("Patched send.js");
