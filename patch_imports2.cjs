const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.replace(/import \{ Building2, ShoppingBag, Settings, ([\s\S]*?) \} from 'lucide-react'/, "import { Building2, Settings, $1 } from 'lucide-react'");
code = code.replace(/Calendar, ShoppingBag, Clock/, "Calendar, Clock");
fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Fixed duplicate import');
