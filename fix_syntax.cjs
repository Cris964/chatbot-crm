const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');
code = code.replace(
    'onClick={() => setShowTemplateModal(false); setAiContextMedia([]); setTemplateMediaUrl(\'\'); setTemplateMediaFile(null); }',
    'onClick={() => { setShowTemplateModal(false); setAiContextMedia([]); setTemplateMediaUrl(\'\'); setTemplateMediaFile(null); }}'
);
fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed syntax error');
