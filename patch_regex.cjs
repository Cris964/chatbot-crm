const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.split("c.preview.match(/\\.(mp4|webm)/i)").join("(c.preview.includes('.mp4') || c.preview.includes('.webm'))");
code = code.split("cleanMsgText.match(/\\.(mp4|webm)/i)").join("(cleanMsgText.includes('.mp4') || cleanMsgText.includes('.webm'))");

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Removed regexes from JSX');
