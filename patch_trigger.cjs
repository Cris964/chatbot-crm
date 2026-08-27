const fs = require('fs');
let code = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /prevMsg\.role === 'agent' && \(prevMsg\.content \|\| ''\)\.includes\('\[DIFUSION\]'\)/;

if (code.match(regex)) {
    code = code.replace(regex, "prevMsg.role === 'agent' && ( (prevMsg.content || '').includes('[DIFUSION]') || (prevMsg.content || '').includes('[Plantilla Enviada:') )");
    fs.writeFileSync('api/_aiHelper.js', code);
    console.log('Patched AI helper to recognize Plantilla Enviada');
} else {
    console.log('Regex not found');
}
