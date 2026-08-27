const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// 1. Sidebar Folders
const folderCode = `<div className={\`inbox-folder \${activeFolder === 'pendientes' ? 'active' : ''}\`} onClick={() => setActiveFolder('pendientes')}>`;
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
const resueltasCode = `setActiveFolder('resueltas')}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    <span>Resueltas</span>
                  </div>
                  {conversationsList.filter(c => c.archived).length > 0 && (
                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{conversationsList.filter(c => c.archived).length}</span>
                  )}
                </div>`;
code = code.replace(resueltasCode, resueltasCode + newFolders);

code = code.replace(/else if \(activeFolder === 'resueltas'\) \{/g, `else if (activeFolder === 'mayoristas') {
        filtered = filtered.filter(c => c.client_type === 'mayorista' && !c.archived);
      } else if (activeFolder === 'detal') {
        filtered = filtered.filter(c => c.client_type === 'detal' && !c.archived);
      } else if (activeFolder === 'resueltas') {`);

// 2. Add Imports
code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react'/, "import { Building2, ShoppingBag, Settings, $1 } from 'lucide-react'");

// 3. UI Modal State
code = code.replace(
    'const [showTemplateModal, setShowTemplateModal] = useState(false)',
    'const [showTemplateModal, setShowTemplateModal] = useState(false)\n  const [showContactSettings, setShowContactSettings] = useState(false)\n  const [editedClientType, setEditedClientType] = useState(\'detal\')'
);

code = code.replace(
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')",
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')\n      setEditedClientType(selectedConv.client_type || 'detal')"
);

// 4. Transform contact-panel into Modal
const oldPanelRegex = /\{\/\*\s*Info Panel\s*\*\/\}.*?(?=\{\/\*\s*Simulation Modal\s*\*\/})/s;
const match = code.match(oldPanelRegex);
if (match) {
    let oldPanel = match[0];
    let newPanel = oldPanel;
    
    newPanel = newPanel.replace(
        /<div className=\{\`contact-panel inbox-panel-container[^>]+>/,
        `{/* Info Panel Modal */}\n{showContactSettings && (<div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}><div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}><div className="contact-panel" style={{ display: 'flex', width: '100%', flexDirection: 'column' }}>`
    );
    
    newPanel = newPanel.replace(
        /<div style=\{\{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 \}\}>.*?<\/div>/s,
        '<div style={{ padding: \'20px\', borderBottom: \'1px solid var(--glass-border)\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}><h3 style={{ fontSize: \'1.1rem\', fontWeight: 800 }}>Configuración de Cliente</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(false)}><Close size={20} /></button></div>'
    );
    
    // CAREFUL! oldPanel ends with TWO closing divs: one for contact-panel, one for inbox-layout
    // We want to replace the FIRST one with `</div></div></div>)}`
    // And keep the SECOND one as `</div>` to close inbox-layout!
    // oldPanel ends with `</div>\n    </div>\n\n      `
    newPanel = newPanel.replace(/<\/div>\s*<\/div>\s*$/, '</div></div></div>)}\n    </div>\n\n      ');
    
    code = code.replace(oldPanel, newPanel);
}

// 5. Add Settings Icon to Chat Header
const chatHeaderRegex = /(<div className="chat-header"[^>]*>[\s\S]*?<div className="flex gap-2">)/;
code = code.replace(chatHeaderRegex, '$1\n                         <button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(true)} title="Configuración de Cliente"><Settings size={18} /></button>');

// 6. Add Client Type Form
const saveTypeFunc = `
    const saveClientType = async (newType) => {
      setEditedClientType(newType)
      if (selectedConv) {
        const { error } = await supabase.from('conversations').update({ client_type: newType }).eq('id', selectedConv.id)
        if (!error) {
          selectedConv.client_type = newType
          setConversationsList(prev => prev.map(c => c.id === selectedConv.id ? { ...c, client_type: newType } : c))
        }
      }
    }
`;
code = code.replace('const handleSaveName = async () =>', saveTypeFunc + '\n    const handleSaveName = async () =>');

const uiClientType = `
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Tipo de Cliente</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className={\`btn btn-sm \${editedClientType === 'detal' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1 }} onClick={() => saveClientType('detal')}>Al Detal</button>
                            <button className={\`btn btn-sm \${editedClientType === 'mayorista' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1 }} onClick={() => saveClientType('mayorista')}>Mayorista</button>
                        </div>
                    </div>
`;
code = code.replace('{isEditingName ? (', uiClientType + '\n                    {isEditingName ? (');

// 7. Clean Media Rendering
code = code.replace(
    />\{c\.preview\}<\/p>/g,
    `>{c.preview?.includes('supabase.co/storage') ? ( (c.preview.includes('.mp4') || c.preview.includes('.webm')) ? '🎥 Video enviado' : '📷 Imagen enviada') : c.preview}</p>`
);

code = code.replace(
    /\{cleanMsgText && <p style=\{\{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' \}\}>\{cleanMsgText\}<\/p>\}/g,
    `{cleanMsgText && <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{cleanMsgText.includes('supabase.co/storage') && cleanMsgText.startsWith('http') && !cleanMsgText.includes(' ') ? ((cleanMsgText.includes('.mp4') || cleanMsgText.includes('.webm')) ? '🎥 Video enviado' : '📷 Imagen enviada') : cleanMsgText}</p>}`
);

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('All patches applied cleanly');
