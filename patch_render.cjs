const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// For the preview
code = code.replace(
    />\{c\.preview\}<\/p>/g,
    `>{c.preview?.includes('supabase.co/storage') ? (c.preview.match(/\\.(mp4|webm)/i) ? '🎥 Video enviado' : '📷 Imagen enviada') : c.preview}</p>`
);

// For the chat bubble when cleanMsgText is just a URL
code = code.replace(
    /\{cleanMsgText && <p style=\{\{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' \}\}>\{cleanMsgText\}<\/p>\}/g,
    `{cleanMsgText && <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{cleanMsgText.includes('supabase.co/storage') && cleanMsgText.startsWith('http') && !cleanMsgText.includes(' ') ? (cleanMsgText.match(/\\.(mp4|webm)/i) ? '🎥 Video enviado' : '📷 Imagen enviada') : cleanMsgText}</p>}`
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Chat render patched');
