const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.replace(/import \{ Building2, ShoppingBag, ([\s\S]*?) \} from 'lucide-react'/, "import { Building2, $1 } from 'lucide-react'");

code = code.replace(
    `className="contact-panel inbox-panel-container \${mobileView !== 'info' ? 'mobile-hidden' : ''}\`}`,
    'className={`contact-panel inbox-panel-container ${mobileView !== \'info\' ? \'mobile-hidden\' : \'\'}`}'
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed syntax error');
