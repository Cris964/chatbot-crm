const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// I replaced </div></div></div>)} with </div></div>)}
code = code.replace(/<\/div><\/div>\)\}/g, '</div></div></div>)}');

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Restored div');
