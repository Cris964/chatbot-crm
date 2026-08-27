const fs = require('fs');

let aiHelper = fs.readFileSync('api/_aiHelper.js', 'utf8');

const regex = /const positiveWords = \['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale'\];\s*if \(positiveWords\.some\(w => contentLower\.includes\(w\)\)\) \{/;

const replacement = `const positiveWords = ['si', 'sí', 's', 'claro', 'info', 'interesa', 'precio', 'quiero', 'mas', 'más', 'dale'];
          const negativeWords = ['no', 'nunca', 'jamas', 'jamás', 'deja', 'dejen', 'cancelar', 'stop'];
          const isNegative = negativeWords.some(w => contentLower.includes(w) || contentLower === w);
          if (!isNegative && positiveWords.some(w => contentLower.includes(w) || contentLower === w)) {`;

aiHelper = aiHelper.replace(regex, replacement);

fs.writeFileSync('api/_aiHelper.js', aiHelper);
console.log("Patched _aiHelper.js (negative words)");
