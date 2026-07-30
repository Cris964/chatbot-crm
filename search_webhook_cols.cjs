const fs = require('fs');
const lines = fs.readFileSync('api/webhook.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('insert([{')) {
    console.log(`${i+1}: ${lines[i+1].trim()} ${lines[i+2].trim()} ${lines[i+3].trim()}`);
  }
});
