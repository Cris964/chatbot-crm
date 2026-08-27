const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.replace(/ShoppingBag, /g, '');
code = code.replace(/Building2, /g, '');
code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react'/, "import { Building2, ShoppingBag, $1 } from 'lucide-react'");

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed imports');
