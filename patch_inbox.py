import re

with open('src/pages/Inbox.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Message Mapper Function definition (insert before Inbox component return)
old_mapping = r"""        return \{
          id: i,
          sender: m\.role === 'user' \? 'client' : \(m\.role === 'assistant' \? 'bot' : 'agent'\),
          text: m\.content \|\| m\.text \|\| m\.media_url \|\| m\.url \|\| '',
          type: m\.type \|\| m\.message_type \|\| inferredType,
          time: dateObj\.toLocaleString\('es-CO', \{ weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' \}\)
        \};"""

new_mapping = """        let finalContent = m.content || m.text || m.media_url || m.url || '';
        let finalType = m.type || m.message_type || inferredType;
        if (finalContent.includes('[IMAGEN_BASE64_URL]:')) {
            finalType = 'image';
            finalContent = finalContent.replace('[IMAGEN_BASE64_URL]:', '').trim();
        } else if (finalContent.includes('[Multimedia:')) {
            finalContent = '🖼️ [Multimedia no disponible]';
        }

        const dateStr = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        return {
          id: i,
          sender: m.role === 'user' ? 'client' : (m.role === 'assistant' ? 'bot' : 'agent'),
          text: finalContent,
          type: finalType,
          time: `${dateStr} ${timeStr}`
        };"""

content = re.sub(old_mapping, new_mapping, content)

# 2. Avatar URL in fetchConversations
old_avatar_gen = r"avatar: displayName\.substring\(0, 2\)\.toUpperCase\(\),"
new_avatar_gen = "avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&bold=true`,"
content = re.sub(old_avatar_gen, new_avatar_gen, content)

# 3. Avatar rendering in Sidebar
old_sidebar_avatar = r"""                 <div className="avatar sm" style={{ background: c\.bg, position: 'relative', flexShrink: 0 }}>
                    \{c\.avatar\}"""
new_sidebar_avatar = """                 <div className="avatar sm" style={{ background: c.bg, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
                    {c.avatar?.startsWith('http') ? <img src={c.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" /> : c.avatar}"""
content = re.sub(old_sidebar_avatar, new_sidebar_avatar, content)

# 4. Avatar rendering in Header
old_header_avatar = r"""                 <div className="avatar md" style={{ background: selectedConv\.bg, width: 36, height: 36, flexShrink: 0 }}>\{selectedConv\.avatar\}</div>"""
new_header_avatar = """                 <div className="avatar md" style={{ background: selectedConv.bg, width: 36, height: 36, flexShrink: 0, overflow: 'hidden' }}>
                    {selectedConv.avatar?.startsWith('http') ? <img src={selectedConv.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" /> : selectedConv.avatar}
                 </div>"""
content = re.sub(old_header_avatar, new_header_avatar, content)

with open('src/pages/Inbox.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Inbox.jsx patched")
