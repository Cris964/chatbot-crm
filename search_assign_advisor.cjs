const fs = require('fs');
const lines = fs.readFileSync('src/pages/Inbox.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('assignAdvisor')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
