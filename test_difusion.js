const finalMessages = [
    { role: 'agent', content: '[DIFUSION]: CARRIEL B09160-3\n$35.000\n3 meses\nCarriel practico para tu dia a dia\nNegro' },
    { role: 'user', content: 'Si' }
];

let isRespondingToDifusion = false;
if (finalMessages.length >= 2) {
    const lastUserMsg = finalMessages[finalMessages.length - 1];
    const prevMsg = finalMessages[finalMessages.length - 2];
    if (lastUserMsg.role === 'user' && prevMsg.role === 'agent' && (prevMsg.content || '').includes('[DIFUSION]')) {
        const contentLower = (lastUserMsg.content || '').toLowerCase().trim();
        const positiveWords = ['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale'];
        if (positiveWords.some(w => contentLower.includes(w))) {
            isRespondingToDifusion = true;
        }
    }
}
console.log("isRespondingToDifusion:", isRespondingToDifusion);
