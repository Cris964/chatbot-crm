const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('className="inbox-layout"'));
console.log(lines.slice(index - 5, index + 5).join('\n'));
