import fs from 'fs';

let content = fs.readFileSync('api/webhook.js', 'utf8');

const target = `                        // Find all image URLs using global regex
                        const imageUrls = [];
                        const imageRegex = /\\[SEND_IMAGE:\\s*(https?:\\/\\/[^\\]]+)\\]/gi;
                        let match;
                        while ((match = imageRegex.exec(botReplyText)) !== null) {
                            imageUrls.push(match[1].trim());
                        }
                        
                        let cleanReply = botReplyText.replace(/\\[NEEDS_HUMAN(?::.*?)?\\]/gi, '').replace(/\\[SALE_CONFIRMED: .*?\\]/gi, '').replace(/\\[LEAD_STATE:.*?\\]/gi, '').replace(/\\[CITA_AGENDADA(?::.*?)?\\]/gi, '').replace(/\\[SEND_IMAGE:.*?\\]/gi, '').trim();`;

const replacement = `                        // Find all image URLs using global regex
                        const imageUrls = [];
                        const imageRegex = /\\[SEND_IMAGE:\\s*(https?:\\/\\/[^\\]]+)\\]/gi;
                        let match;
                        while ((match = imageRegex.exec(botReplyText)) !== null) {
                            imageUrls.push(match[1].trim());
                        }

                        // Fallback: Si la IA insiste en usar Markdown para imágenes
                        const mdRegex = /\\[.*?\\]\\((https?:\\/\\/[^\\)]+)\\)/gi;
                        let m;
                        while ((m = mdRegex.exec(botReplyText)) !== null) {
                            if (m[1].includes('supabase.co/storage')) {
                                imageUrls.push(m[1].trim());
                            }
                        }
                        
                        let cleanReply = botReplyText.replace(/\\[NEEDS_HUMAN(?::.*?)?\\]/gi, '').replace(/\\[SALE_CONFIRMED: .*?\\]/gi, '').replace(/\\[LEAD_STATE:.*?\\]/gi, '').replace(/\\[CITA_AGENDADA(?::.*?)?\\]/gi, '').replace(/\\[SEND_IMAGE:.*?\\]/gi, '');
                        
                        // Limpiar los links de markdown de Supabase del mensaje de texto
                        cleanReply = cleanReply.replace(/\\[.*?\\]\\((https?:\\/\\/[^\\)]+)\\)/gi, (full, url) => {
                            if (url.includes('supabase.co/storage')) return '';
                            return full;
                        }).trim();`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('api/webhook.js', content);
    console.log('Successfully updated webhook.js!');
} else {
    console.log('Target block not found in webhook.js');
}
