const fs = require('fs');
let code = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /\/\/ Round Robin \/ Load Balancing Assignment if human needed and no specific role matched\s*if \(needsHuman && !assignedUserId\) \{/;
const replacement = `// Fetch current conversation state to avoid stealing chats from existing agents
    const { data: currentConv } = await supabase.from('conversations').select('assigned_to').eq('id', conversationId).single();

    // Round Robin / Load Balancing Assignment if human needed and no specific role matched
    if (needsHuman && !assignedUserId && (!currentConv || !currentConv.assigned_to)) {`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('api/_aiHelper.js', code);
    console.log('Fixed chat stealing!');
} else {
    console.log('Regex failed');
}
