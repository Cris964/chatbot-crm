const fs = require('fs');
const lines = fs.readFileSync('api/webhook.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes("from('leads')") || l.includes("from('conversations')")) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
