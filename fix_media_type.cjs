const fs = require('fs');
let content = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');
content = content.replace(/const mediaType = getMedia/, 'const mType = getMedia');
content = content.replace(/if \(mediaType === 'image' \|\| mediaType === 'video'\)/, "if (mType === 'image' || mType === 'video')");
content = content.replace(/type: mediaType, timestamp/, 'type: mType, timestamp');
fs.writeFileSync('src/pages/Inbox.jsx', content);
