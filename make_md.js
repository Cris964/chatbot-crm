const data = require('./report.json');

let md = '# Reportes de Activo Morrales\n\n## 1. Productos sin foto (' + data.productsWithoutPhotos.length + ')\n\n';
md += 'Estos productos actualmente no tienen foto asignada o siguen usando la imagen por defecto.\n\n';
md += data.productsWithoutPhotos.map(p => '- ' + p).join('\n');

md += '\n\n## 2. Contactos con errores frecuentes de Meta (' + data.contactsWithErrors.length + ')\n\n';
md += 'Estos clientes suelen presentar errores cuando se les envía una difusión (generalmente porque Meta los ha bloqueado por spam, o excedieron su límite, o hay un problema con su número).\n\n';
md += '| Teléfono | Nombre | Fallos Registrados | Error Común |\n';
md += '|---|---|---|---|\n';
data.contactsWithErrors.forEach(c => {
    let errStr = c.errors.join('<br>').replace(/\[SISTEMA\]:.*?Motivo: /g, '').replace(/\[SISTEMA\]:.*?Código: /g, '').substring(0, 100);
    md += '| ' + c.phone + ' | ' + (c.name || 'Desconocido') + ' | ' + c.fails + ' | ' + errStr + ' |\n';
});

require('fs').writeFileSync('C:\\Users\\eliza\\.gemini\\antigravity\\brain\\a97c1c96-bf51-4307-8702-c91c1b1920d6\\reportes_activo.md', md);
