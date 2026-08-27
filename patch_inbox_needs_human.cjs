const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// There are multiple places where needs_human: true is set. We only want to change it inside handleSendTemplate.
// Inside handleSendTemplate, it looks like this:
// const { error } = await supabase.from('conversations').update({ messages: [...selectedConv.rawMessages, messageObj], updated_at: new Date().toISOString(), needs_human: true }).eq('id', selectedConv.id)

const regex = /const handleSendTemplate = async \((?:.|\n)*?needs_human: true(?:.|\n)*?alert\(`Plantilla/g;

if (code.match(regex)) {
    code = code.replace(/needs_human: true/g, (match, offset, fullString) => {
        // Only replace if we are inside handleSendTemplate
        // We know handleSendTemplate is around line 1800, so we can just replace the specific one.
        return match;
    });
}
