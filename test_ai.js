const stopWords = ['para', 'como', 'este', 'esta', 'pero', 'quiero', 'necesito', 'busco', 'tienen', 'tiene', 'del', 'las', 'los', 'que', 'por', 'con', 'sin', 'una', 'uno', 'mas', 'muy', 'son', 'color'];
const sanitizedMsgs = 'si';
let keywords = sanitizedMsgs.split(/[^a-z0-9x]+/).filter(w => w.length >= 2 && !stopWords.includes(w));
console.log('Keywords:', keywords);
