const fs = require('fs');
const lines = fs.readFileSync('src/pages/Inbox.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('admin') || l.toLowerCase().includes('role') || l.toLowerCase().includes('session.user')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
