const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Fetch Conversations
code = code.replace(
  "// 3. Fetch Team Members",
  "// 3. Fetch Team Members\n      const { data: teamMembers } = await supabase\n        .from('team_members')\n        .select('*')\n        .eq('client_id', tenant.clientId)\n\n      // 4. Fetch Conversations\n      const { data: convs } = await supabase\n        .from('conversations')\n        .select('*')\n        .eq('client_id', tenant.clientId)\n\n      // 3. Fetch Team Members (Dummy placeholder to replace the original string)"
);

// 2. Compute AI Chats and Human Chats
const computeLogic = `        if (!orders || orders.length === 0) {
           totalRevenue = wonLeads.reduce((sum, l) => sum + parseVal(l.value || l.amount), 0);
           totalSalesCount = won;
        }

        let aiChatsCount = 0;
        let pendingChatsCount = 0;
        
        if (convs) {
           convs.forEach(c => {
              if (c.needs_human) pendingChatsCount++;
              let handledByAi = false;
              let handledByHuman = false;
              if (c.messages && Array.isArray(c.messages)) {
                 c.messages.forEach(m => {
                    if (m.role === 'assistant') handledByAi = true;
                    if (m.role === 'agent') handledByHuman = true;
                 });
              }
              if (handledByAi) aiChatsCount++;
              
              const date = new Date(c.created_at || c.updated_at)
              const monthIdx = date.getMonth()
              if (date.getFullYear() === 2026) {
                 if (handledByAi) grouped[monthIdx].value += 1;
                 if (handledByHuman) grouped[monthIdx].value2 += 1;
              }
           })
        }
        
        setChartData(grouped)`;

code = code.replace(
  /if \(\!orders \|\| orders\.length === 0\) \{\s*totalRevenue = wonLeads\.reduce\(\(sum, l\) => sum \+ parseVal\(l\.value \|\| l\.amount\), 0\);\s*totalSalesCount = won;\s*wonLeads\.forEach[^}]+\}\s*\}\s*\}\s*setChartData\(grouped\)/s,
  computeLogic
);

// 3. setStats update
code = code.replace(
  "conversion: convRate\n        }))",
  "conversion: convRate,\n          aiChats: aiChatsCount,\n          pendingChats: pendingChatsCount\n        }))"
);

// 4. Team Members chats handled
const teamLogic = `if (teamMembers && teamMembers.length > 0) {
           const metrics = teamMembers.map(member => {
              const mLeads = leads.filter(l => l.assigned_to === member.user_id || l.assigned_to === member.id || l.assigned_to === member.full_name)
              const won = mLeads.filter(l => l.stage === 'Gano')
              
              let chatsHandled = 0;
              if (convs) {
                 chatsHandled = convs.filter(c => c.assigned_to === member.user_id || c.assigned_to === member.id).length;
              }

              return {
                 id: member.id,
                 name: member.full_name || 'Desconocido',
                 totalAssigned: chatsHandled,
                 newLeads: mLeads.filter(l => l.stage === 'Nuevo').length,
                 won: won.length,
                 lost: mLeads.filter(l => l.stage === 'Perdio').length,
                 revenue: won.reduce((sum, l) => sum + parseVal(l.value || l.amount), 0)
              }
           })`;
code = code.replace(
  /if \(teamMembers && teamMembers\.length > 0\) \{\s*const metrics = teamMembers\.map\(member => \{\s*const mLeads = leads\.filter[^\}]+Gano'\)\s*return \{[^\}]+\}\s*\}\)/s,
  teamLogic
);

// 5. JSX Cards update
code = code.replace(
  /<div className="relative z-10" style=\{\{ fontSize: '0.8rem', color: 'var\(--text-tertiary\)', fontWeight: 600 \}\}>Tasa de Conversión<\/div>/,
  '<div className="relative z-10" style={{ fontSize: \'0.8rem\', color: \'var(--text-tertiary)\', fontWeight: 600 }}>Chats Atendidos por IA</div>'
);
code = code.replace(
  /<div className="relative z-10" style=\{\{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' \}\}>\{stats.conversion\}<\/div>/,
  '<div className="relative z-10" style={{ fontSize: \'1.75rem\', fontWeight: 800, margin: \'8px 0\' }}>{stats.aiChats || 0}</div>'
);
code = code.replace(
  /<div style=\{\{ fontSize: '0.8rem', color: 'var\(--text-tertiary\)', fontWeight: 600 \}\}>Leads en Proceso<\/div>/,
  '<div style={{ fontSize: \'0.8rem\', color: \'var(--text-tertiary)\', fontWeight: 600 }}>Chats Pendientes</div>'
);
code = code.replace(
  /<div style=\{\{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' \}\}>\{stats.dealsActive\}<\/div>/,
  '<div style={{ fontSize: \'1.75rem\', fontWeight: 800, margin: \'8px 0\' }}>{stats.pendingChats || 0}</div>'
);
code = code.replace(
  /<div style=\{\{ fontSize: '0.75rem', color: 'var\(--text-tertiary\)' \}\}>Seguimiento activo<\/div>/,
  '<div style={{ fontSize: \'0.75rem\', color: \'var(--text-tertiary)\' }}>Esperando asesor humano</div>'
);

// 6. JSX Chart update
code = code.replace(
  /<div className="flex items-center gap-2" style=\{\{ fontSize: '0.75rem', color: 'var\(--text-tertiary\)' \}\}>\s*<div style=\{\{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' \}\}><\/div> Ventas 2026\s*<\/div>/s,
  `<div className="flex items-center gap-4" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}></div> Chats IA</span>
                <span className="flex items-center gap-1"><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Chats Humanos</span>
              </div>`
);

code = code.replace(
  /tickFormatter=\{\(v\) => `\$\$\{v\/1000\}k`\} \/>/,
  `tickFormatter={(v) => \`\${v}\`} />`
);

code = code.replace(
  /<Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth=\{3\} fill="url\(#colorValue\)" dot=\{\{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' \}\} \/>/,
  `<Area type="monotone" name="Chats IA" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorValue)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" name="Chats Humanos" dataKey="value2" stroke="#10b981" strokeWidth={3} fill="url(#colorValue)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />`
);

fs.writeFileSync('src/pages/Dashboard.jsx', code);
console.log('Dashboard.jsx updated successfully.');
