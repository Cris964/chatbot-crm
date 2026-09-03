import re

with open('src/pages/Inbox.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace difusiones logic
regex = re.compile(r"<h2 style=\{\{\s*fontSize: '0\.75rem'.*?Difusiones[\s\S]*?\{\s*isListsExpanded && \([\s\S]*?<\/div>\s*\)\}", re.DOTALL)

difusionesFolder = """
             <div className="folder-divider" style={{ margin: '16px 0', borderBottom: '1px solid var(--glass-border)', opacity: 0.5 }}></div>
             <div 
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', transition: 'all 0.2s', background: activeFolder === 'difusiones' ? 'var(--primary-color)' : 'transparent', color: activeFolder === 'difusiones' ? '#fff' : 'var(--text-primary)' }}
               onClick={() => { setActiveFolder('difusiones'); setMobileView('list'); }}
             >
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Megaphone size={16} opacity={activeFolder === 'difusiones' ? 1 : 0.7} />
                 <span style={{ fontWeight: activeFolder === 'difusiones' ? 600 : 500, fontSize: '0.9rem' }}>Difusiones</span>
               </div>
               <span style={{ fontSize: '0.7rem', fontWeight: 700, background: activeFolder === 'difusiones' ? 'rgba(255,255,255,0.25)' : 'rgba(var(--overlay-rgb), 0.1)', color: activeFolder === 'difusiones' ? '#fff' : 'var(--text-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                 {conversationsList.filter(c => getConversationFolder(c).startsWith('broadcast_')).length}
               </span>
             </div>
"""
code = regex.sub(difusionesFolder, code)

# 2. Add Settings Button
btnStart = code.find('<button className="btn btn-ghost btn-sm" onClick={() => setBotActive(!botActive)}')
if btnStart != -1 and 'setShowContactSettings(true)' not in code:
    new_btn = '<button className="btn btn-ghost btn-sm" onClick={() => setShowContactSettings(true)} title="Configuración de Cliente"><Settings size={18} /></button>\n                           '
    code = code[:btnStart] + new_btn + code[btnStart:]

# 3. Grid
code = re.sub(r"gridTemplateColumns: showRightPanel \? '220px 320px 1fr 340px' : '220px 320px 1fr'", "gridTemplateColumns: '220px 320px 1fr'", code)

# 4. Floating Toggle
code = re.sub(r"\{\/\*\s*Floating Toggle Button for Contact Panel\s*\*\/\}\s*<button[\s\S]*?<\/button>", "", code)

# 5. Filter logic
filterLogic = """
                   if (activeFolder === 'mayoristas') return c.client_type === 'mayorista' && !c.archived;
                   if (activeFolder === 'detal') return c.client_type === 'detal' && !c.archived;
                   if (activeFolder === 'difusiones') return fId.startsWith('broadcast_');
                   if (activeFolder === 'resolved') return c.archived;
                   if (activeFolder.startsWith('broadcast_')) return fId === activeFolder;
"""
code = code.replace("if (activeFolder === 'resolved') return c.archived;", filterLogic)

with open('src/pages/Inbox.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Python patch applied!")
