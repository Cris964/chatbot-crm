const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

code = code.replace(
    'await supabase.from(\'conversations\').update({ messages: updatedMsgs }).eq(\'id\', selectedConv.id);\r\n               alert(`Plantilla',
    'await supabase.from(\'conversations\').update({ messages: updatedMsgs, needs_human: false }).eq(\'id\', selectedConv.id);\r\n               setBotActive(true);\r\n               alert(`Plantilla'
);
code = code.replace(
    'await supabase.from(\'conversations\').update({ messages: updatedMsgs }).eq(\'id\', selectedConv.id);\n               alert(`Plantilla',
    'await supabase.from(\'conversations\').update({ messages: updatedMsgs, needs_human: false }).eq(\'id\', selectedConv.id);\n               setBotActive(true);\n               alert(`Plantilla'
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Patched needs_human for template send!');
