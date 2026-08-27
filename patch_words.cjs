const fs = require('fs');
let code = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /const positiveWords = \['si', 's[^']*', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'm[^']*', 'dale'\];/;

if (code.match(regex)) {
    code = code.replace(regex, "const positiveWords = ['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale', 'porfa', 'favor', 'muestrame', 'sii', 'siii', 'bueno', 'hágale', 'hagale', 'ok', 'okay'];");
    fs.writeFileSync('api/_aiHelper.js', code);
    console.log('Added more positive words!');
} else {
    console.log('Regex did not match.');
}
