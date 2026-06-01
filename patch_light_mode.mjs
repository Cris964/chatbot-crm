import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace rgba(255, 255, 255, X) with rgba(var(--overlay-rgb), X)
  // Also handle rgba(255,255,255,X)
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)/g, 'rgba(var(--overlay-rgb), $1)');

  // Fix white text
  content = content.replace(/color:\s*['"]white['"]/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*['"]#fff['"]/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*['"]#ffffff['"]/g, 'color: "var(--text-primary)"');
  
  if (original !== content) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
