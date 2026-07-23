const fs = require('fs');
const path = require('path');

function searchFilesInDir(startPath, filter, searchRegex) {
    if (!fs.existsSync(startPath)) return;
    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            searchFilesInDir(filename, filter, searchRegex);
        } else if (filename.endsWith(filter)) {
            const content = fs.readFileSync(filename, 'utf-8');
            if (searchRegex.test(content)) {
                console.log(`Found in: ${filename}`);
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (searchRegex.test(line)) {
                        console.log(`  Line ${index + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

searchFilesInDir('src/pages', '.jsx', /\.delete\(/);
searchFilesInDir('api', '.js', /\.delete\(/);
