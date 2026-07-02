const fs = require('fs');
const code = fs.readFileSync('api/webhook.js', 'utf8');
const lines = code.split('\n');
let depth = 0;
for (let i=0; i<lines.length; i++) {
    let oldDepth = depth;
    for (let char of lines[i]) {
        if (char === '{') depth++;
        if (char === '}') depth--;
    }
    if (i >= 30 && i <= 190 && depth !== oldDepth) {
        console.log(`${i+1} [${oldDepth} -> ${depth}]: ${lines[i]}`);
    }
}
