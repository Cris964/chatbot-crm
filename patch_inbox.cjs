const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

const target = `updated_at: new Date().toISOString(),
          needs_human: true
        })
        .eq('id', selectedConv.id)`;

const replacement = `updated_at: new Date().toISOString(),
          needs_human: false
        })
        .eq('id', selectedConv.id)`;

if (code.includes(target)) {
  fs.writeFileSync('src/pages/Inbox.jsx', code.replace(target, replacement));
  console.log('Patched Inbox.jsx');
} else {
  console.log('Target not found in Inbox.jsx');
}
