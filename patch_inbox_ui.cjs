const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

if (!code.includes('const [showContactSettings')) {
    code = code.replace(
        'const [showTemplateModal, setShowTemplateModal] = useState(false)',
        'const [showTemplateModal, setShowTemplateModal] = useState(false)\n  const [showContactSettings, setShowContactSettings] = useState(false)\n  const [editedClientType, setEditedClientType] = useState(\'detal\')'
    );
}

code = code.replace(
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')",
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')\n      setEditedClientType(selectedConv.client_type || 'detal')"
);

const oldPanelRegex = /\{\/\*\s*Info Panel\s*\*\/\}.*?(?=\{\/\*\s*Simulation Modal\s*\*\/})/s;
const match = code.match(oldPanelRegex);
if (match) {
    let oldPanel = match[0];
    
    let newPanel = oldPanel.replace(
        '<div className={`contact-panel',
        '{showContactSettings && (<div className="modal-overlay" style={{ position: \'fixed\', inset: 0, background: \'rgba(0,0,0,0.85)\', zIndex: 1000, display: \'flex\', alignItems: \'center\', justifyContent: \'center\', padding: 20, backdropFilter: \'blur(10px)\' }}><div className="card animate-scaleIn" style={{ width: \'100%\', maxWidth: 420, padding: 0, overflow: \'hidden\', maxHeight: \'90vh\', overflowY: \'auto\' }}><div className="contact-panel'
    );
    
    newPanel = newPanel.replace(
        /<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>.*?<\/div>/s,
        '<div style={{ padding: \'20px\', borderBottom: \'1px solid var(--glass-border)\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}><h3 style={{ fontSize: \'1.1rem\', fontWeight: 800 }}>Configuración de Cliente</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(false)}><Close size={20} /></button></div>'
    );
    
    newPanel = newPanel.trim() + '</div></div>)}';
    code = code.replace(oldPanel, '{/* Info Panel Modal */}\n' + newPanel + '\n\n      ');
}

const chatHeaderRegex = /(<div className="chat-header"[^>]*>[\s\S]*?<div className="flex gap-2">)/;
code = code.replace(chatHeaderRegex, '$1\n                         <button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(true)} title="Configuración de Cliente"><Settings size={18} /></button>');

if (!code.includes('Settings,')) {
    code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react'/, "import { Settings, $1 } from 'lucide-react'");
}

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
if (!code.includes('saveClientType')) {
    code = code.replace('const handleSaveName = async () =>', saveTypeFunc + '\n    const handleSaveName = async () =>');
}

const uiClientType = `
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Tipo de Cliente</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className={\`btn btn-sm \${editedClientType === 'detal' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1 }} onClick={() => saveClientType('detal')}>Al Detal</button>
                            <button className={\`btn btn-sm \${editedClientType === 'mayorista' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1 }} onClick={() => saveClientType('mayorista')}>Mayorista</button>
                        </div>
                    </div>
`;
if (!code.includes('Tipo de Cliente')) {
    code = code.replace('{isEditingName ? (', uiClientType + '\n                    {isEditingName ? (');
}

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log('Inbox UI patched');
