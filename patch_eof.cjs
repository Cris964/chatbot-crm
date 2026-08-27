const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.replace("</div></div>\\n  )\\n}", "</div>\n  )\n}");

const lastDivIndex = code.lastIndexOf('</div>');
code = code.substring(0, lastDivIndex) + '</div></div>' + code.substring(lastDivIndex + 6);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed end of file');
