const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// The end of the contact panel is:
// 1777|             </div>
// 1778|          </div>
// 1779|        </div></div></div>)}

// Let's replace the excessive closing divs.
code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div><\/div><\/div>\)\}/g,
    '</div></div>)}'
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed extra divs');
