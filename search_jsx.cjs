const fs = require('fs');
const path = require('path');

function searchFiles(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchFiles(fullPath, query);
        } else if (fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log(`Found "${query}" in: ${fullPath}`);
            }
        }
    }
}

searchFiles('C:\\Users\\eliza\\.gemini\\antigravity\\scratch\\chatbot-crm\\src', 'template');
searchFiles('C:\\Users\\eliza\\.gemini\\antigravity\\scratch\\chatbot-crm\\src', 'plantilla');
