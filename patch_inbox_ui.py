import re

with open('src/pages/Inbox.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add ContactSettings Modal State
if 'const [showContactSettings' not in code:
    code = code.replace(
        'const [showTemplateModal, setShowTemplateModal] = useState(false)',
        'const [showTemplateModal, setShowTemplateModal] = useState(false)\n  const [showContactSettings, setShowContactSettings] = useState(false)\n  const [editedClientType, setEditedClientType] = useState(\'detal\')'
    )

# When selectedConv is set, we set editedClientType
code = code.replace(
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')",
    "setEditedName(selectedConv.client?.name || selectedConv.user_name || '')\n      setEditedClientType(selectedConv.client_type || 'detal')"
)

# Replace the contact-panel with a Modal overlay
old_panel_regex = r'\{\/\*\s*Info Panel\s*\*\/\}.*?(?=\{\/\*\s*Simulation Modal\s*\*\/})'
match = re.search(old_panel_regex, code, re.DOTALL)
if match:
    old_panel = match.group(0)
    
    new_panel = old_panel.replace(
        '<div className={`contact-panel',
        '{showContactSettings && (<div className="modal-overlay" style={{ position: \'fixed\', inset: 0, background: \'rgba(0,0,0,0.85)\', zIndex: 1000, display: \'flex\', alignItems: \'center\', justifyContent: \'center\', padding: 20, backdropFilter: \'blur(10px)\' }}><div className="card animate-scaleIn" style={{ width: \'100%\', maxWidth: 420, padding: 0, overflow: \'hidden\', maxHeight: \'90vh\', overflowY: \'auto\' }}><div className="contact-panel'
    )
    
    new_panel = re.sub(
        r'<div style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', marginBottom: 20 }}>.*?<\/div>',
        '<div style={{ padding: \'20px\', borderBottom: \'1px solid var(--glass-border)\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}><h3 style={{ fontSize: \'1.1rem\', fontWeight: 800 }}>Configuración de Cliente</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(false)}><Close size={20} /></button></div>',
        new_panel, flags=re.DOTALL
    )
    
    new_panel = new_panel.rstrip() + '</div></div>)}'
    
    code = code.replace(old_panel, '{/* Info Panel Modal */}\n' + new_panel + '\n\n      ')

# Add Settings Icon to Chat Header
chat_header_regex = r'(<div className="chat-header"[^>]*>[\s\S]*?<div className="flex gap-2">)'
code = re.sub(chat_header_regex, r'\g<1>\n                         <button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(true)} title="Configuración de Cliente"><Settings size={18} /></button>', code)

# Ensure Settings is imported
if 'Settings,' not in code:
    code = re.sub(r'import \{([\s\S]*?)\} from \'lucide-react\'', r"import { Settings, \g<1> } from 'lucide-react'", code)

# Add saveClientType function and UI for client type
save_type_func = """
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
"""
if 'saveClientType' not in code:
    code = code.replace('const handleSaveName = async () =>', save_type_func + '\n    const handleSaveName = async () =>')

ui_client_type = """
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Tipo de Cliente</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className={`btn btn-sm ${editedClientType === 'detal' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => saveClientType('detal')}>Al Detal</button>
                            <button className={`btn btn-sm ${editedClientType === 'mayorista' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => saveClientType('mayorista')}>Mayorista</button>
                        </div>
                    </div>
"""
if 'Tipo de Cliente' not in code:
    code = code.replace('{isEditingName ? (', ui_client_type + '\n                    {isEditingName ? (')

with open('src/pages/Inbox.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Inbox UI patched')
