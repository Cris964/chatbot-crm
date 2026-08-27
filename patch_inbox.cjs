const fs = require('fs');

let code = fs.readFileSync('src/pages/Inbox.jsx', 'utf8');

// 1. Add state for editing name
const stateRegex = /const \[newMessage, setNewMessage\] = useState\(''\)/;
if (code.match(stateRegex)) {
    code = code.replace(stateRegex, `const [newMessage, setNewMessage] = useState('')
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')`);
} else {
    console.log("Could not find state insertion point");
}

// 2. Add lucide icons if needed
const importRegex = /Trash2, UserPlus, Facebook,/;
if (code.match(importRegex)) {
    code = code.replace(importRegex, `Trash2, UserPlus, Facebook, Edit2, Check as CheckIcon,`);
}

// 3. Add handleSaveName function before fetchConversations or inside component
const funcRegex = /const handleAssign = async \(\) => \{/;
if (code.match(funcRegex)) {
    code = code.replace(funcRegex, `
    const handleSaveName = async () => {
        if (!selectedConv) return;
        setIsEditingName(false);
        try {
            const { error } = await supabase.from('conversations').update({ user_name: editedName }).eq('id', selectedConv.id);
            if (!error) {
                // Update local state
                setConversationsList(prev => prev.map(c => c.id === selectedConv.id ? { ...c, name: editedName } : c));
                setSelectedConv(prev => ({ ...prev, name: editedName }));
            }
        } catch(e) { console.error(e) }
    };

    const handleAssign = async () => {`);
}

// 4. Update the UI in 'Contact' panel
const contactRegex = /<div className="animate-slideUp">\s*<h4 style=\{\{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 \}\}>Contacto<\/h4>\s*<div style=\{\{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 \}\}>/;

if (code.match(contactRegex)) {
    code = code.replace(contactRegex, `<div className="animate-slideUp">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                       <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>Contacto</h4>
                       {!isEditingName ? (
                         <button className="btn btn-ghost btn-sm" onClick={() => { setEditedName(selectedConv?.name || ''); setIsEditingName(true); }} style={{ padding: 4 }}>
                            <Edit2 size={14} />
                         </button>
                       ) : (
                         <button className="btn btn-primary btn-sm" onClick={handleSaveName} style={{ padding: '2px 8px' }}>
                            <CheckIcon size={14} />
                         </button>
                       )}
                    </div>
                    {isEditingName ? (
                       <input 
                         type="text" 
                         className="input" 
                         value={editedName} 
                         onChange={e => setEditedName(e.target.value)} 
                         style={{ marginBottom: 16, fontSize: '0.85rem', padding: '6px 10px' }} 
                         placeholder="Nombre del cliente" 
                       />
                    ) : (
                       <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>{selectedConv?.name || 'Sin nombre'}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>`);
} else {
    console.log("Could not find contact panel insertion point");
}

fs.writeFileSync('src/pages/Inbox.jsx', code);
console.log("Patched Inbox.jsx");
