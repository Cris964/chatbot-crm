const fs = require('fs');
let code = fs.readFileSync('src/pages/Products.jsx', 'utf8');

code = code.replace(
  /image_url_1: '',\s*image_url_2: ''/,
  "image_url_1: '', image_url_2: '', image_url_3: '', image_url_4: '', image_url_5: ''"
);

code = code.replace(
  /image_url_1: urls\[0\] \? urls\[0\]\.trim\(\) : '',\s*image_url_2: urls\[1\] \? urls\[1\]\.trim\(\) : ''/,
  "image_url_1: urls[0] ? urls[0].trim() : '', image_url_2: urls[1] ? urls[1].trim() : '', image_url_3: urls[2] ? urls[2].trim() : '', image_url_4: urls[3] ? urls[3].trim() : '', image_url_5: urls[4] ? urls[4].trim() : ''"
);

code = code.replace(
  /const combinedUrls = \[form\.image_url_1, form\.image_url_2\]\.map\(u => u\?\.trim\(\)\)\.filter\(Boolean\)\.join\(\',\'\) \|\| null;/,
  "const combinedUrls = [form.image_url_1, form.image_url_2, form.image_url_3, form.image_url_4, form.image_url_5].map(u => u?.trim()).filter(Boolean).join(',') || null;"
);

const jsxToReplaceRegex = /<div style={{ gridColumn: 'span 2' }}>[\s\S]*?La IA enviará AMBAS fotos automáticamente por WhatsApp cuando le pidan catálogo\.[\s\S]*?<\/p>\s*<\/div>/;
const newJsx = `
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                      Archivo Multimedia {num} {num === 5 ? '(Permite MP4)' : ''}
                    </label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {form[\`image_url_\${num}\`] && (
                        form[\`image_url_\${num}\`].endsWith('.mp4') ?
                          <video src={form[\`image_url_\${num}\`]} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--glass-border)' }} muted /> :
                          <img src={form[\`image_url_\${num}\`]} alt={\`Media \${num}\`} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://..."
                          value={form[\`image_url_\${num}\`]}
                          onChange={e => setForm({ ...form, [\`image_url_\${num}\`]: e.target.value })}
                          style={{ marginBottom: 8 }}
                        />
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                          <Upload size={14} style={{ marginRight: 6 }} /> 
                          {isSaving ? 'Subiendo...' : 'Subir Archivo'}
                          <input type="file" hidden accept="image/*,video/mp4" onChange={e => handleImageUpload(e, \`image_url_\${num}\`)} disabled={isSaving} />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 0 }}>
                    La IA enviará TODOS los archivos configurados. Sube fotos o videos MP4 (máx 16MB).
                  </p>
                </div>
`;

code = code.replace(jsxToReplaceRegex, newJsx.trim());

fs.writeFileSync('src/pages/Products.jsx', code);
console.log('Products.jsx modified!');
