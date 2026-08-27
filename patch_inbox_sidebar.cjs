const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// The sidebar has folders like "Entrada", "Asignadas", "Pendientes", "Resueltas"
// Find "Pendientes"
const folderCode = `<div className={\`inbox-folder \${activeFolder === 'pendientes' ? 'active' : ''}\`} onClick={() => setActiveFolder('pendientes')}>
                  <div className="flex items-center gap-3">
                    <Clock size={18} />
                    <span>Pendientes</span>
                  </div>
                  {conversationsList.filter(c => c.needs_human && !c.assigned_to && !c.archived).length > 0 && (
                    <span className="badge" style={{ background: 'var(--accent-amber)', color: '#000' }}>{conversationsList.filter(c => c.needs_human && !c.assigned_to && !c.archived).length}</span>
                  )}
                </div>`;

const newFolders = `
                <div className="folder-divider" style={{ margin: '16px 0', borderBottom: '1px solid var(--glass-border)', opacity: 0.5 }}></div>
                <div className="folder-title" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', padding: '0 16px', marginBottom: 8, fontWeight: 700 }}>Categorías</div>
                <div className={\`inbox-folder \${activeFolder === 'mayoristas' ? 'active' : ''}\`} onClick={() => setActiveFolder('mayoristas')}>
                  <div className="flex items-center gap-3">
                    <Building2 size={18} />
                    <span>Mayoristas</span>
                  </div>
                  {conversationsList.filter(c => c.client_type === 'mayorista' && !c.archived).length > 0 && (
                    <span className="badge">{conversationsList.filter(c => c.client_type === 'mayorista' && !c.archived).length}</span>
                  )}
                </div>
                <div className={\`inbox-folder \${activeFolder === 'detal' ? 'active' : ''}\`} onClick={() => setActiveFolder('detal')}>
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={18} />
                    <span>Al Detal</span>
                  </div>
                  {conversationsList.filter(c => c.client_type === 'detal' && !c.archived).length > 0 && (
                    <span className="badge">{conversationsList.filter(c => c.client_type === 'detal' && !c.archived).length}</span>
                  )}
                </div>
`;

// we need to insert this after Resueltas
const resueltasCode = `setActiveFolder('resueltas')}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    <span>Resueltas</span>
                  </div>
                  {conversationsList.filter(c => c.archived).length > 0 && (
                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{conversationsList.filter(c => c.archived).length}</span>
                  )}
                </div>`;

if (!code.includes('Building2')) {
    code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react'/, "import { Building2, ShoppingBag, $1 } from 'lucide-react'");
}

if (!code.includes("activeFolder === 'mayoristas'")) {
    code = code.replace(resueltasCode, resueltasCode + newFolders);
}

// Modify the filter logic
const filterRegex = /let filtered = \[...conversationsList\];\s*if\s*\(activeFolder === 'entrada'\) \{[\s\S]*?\} else if \(activeFolder === 'resueltas'\) \{[\s\S]*?\}/;
const newFilter = `let filtered = [...conversationsList];
      if (activeFolder === 'entrada') {
        filtered = filtered.filter(c => c.needs_human && !c.assigned_to && !c.archived);
      } else if (activeFolder === 'asignadas') {
        filtered = filtered.filter(c => c.needs_human && c.assigned_to === user?.id && !c.archived);
      } else if (activeFolder === 'sin_asignar') {
        filtered = filtered.filter(c => !c.needs_human && !c.archived);
      } else if (activeFolder === 'pendientes') {
        filtered = filtered.filter(c => c.needs_human && !c.assigned_to && !c.archived);
      } else if (activeFolder === 'mayoristas') {
        filtered = filtered.filter(c => c.client_type === 'mayorista' && !c.archived);
      } else if (activeFolder === 'detal') {
        filtered = filtered.filter(c => c.client_type === 'detal' && !c.archived);
      } else if (activeFolder === 'resueltas') {
        filtered = filtered.filter(c => c.archived);
      }`;

if (code.match(filterRegex)) {
    code = code.replace(filterRegex, newFilter);
} else {
    // If it doesn't perfectly match, let's just find "else if (activeFolder === 'resueltas') {"
    code = code.replace(/else if \(activeFolder === 'resueltas'\) \{/g, `else if (activeFolder === 'mayoristas') {
        filtered = filtered.filter(c => c.client_type === 'mayorista' && !c.archived);
      } else if (activeFolder === 'detal') {
        filtered = filtered.filter(c => c.client_type === 'detal' && !c.archived);
      } else if (activeFolder === 'resueltas') {`);
}

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Sidebar patched');
