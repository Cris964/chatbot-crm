const fs = require('fs');
let code = fs.readFileSync('scratch/Dashboard.bak.jsx', 'utf8');

// 1. Inject aiChatsCount and pendingChatsCount computation logic
const originalSetChartDataStr = `
        if (!orders || orders.length === 0) {
           totalRevenue = wonLeads.reduce((sum, l) => sum + parseVal(l.value || l.amount), 0);
           totalSalesCount = won;
           
           wonLeads.forEach(l => {
             const date = new Date(l.created_at)
             const monthIdx = date.getMonth()
             if (date.getFullYear() === 2026) {
               grouped[monthIdx].value += parseVal(l.value || l.amount)
               grouped[monthIdx].value2 = grouped[monthIdx].value * 0.7 
             }
           })
        }
        
        setChartData(grouped)
`;

const newComputationLogic = `
        if (!orders || orders.length === 0) {
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
        
        setChartData(grouped)
`;

code = code.replace(originalSetChartDataStr.trim(), newComputationLogic.trim());

// 2. Inject aiChats and pendingChats into setStats
code = code.replace(
  'conversion: convRate\n        }))',
  'conversion: convRate,\n          aiChats: aiChatsCount,\n          pendingChats: pendingChatsCount\n        }))'
);
// just in case it had carriage return
code = code.replace(
  'conversion: convRate\r\n        }))',
  'conversion: convRate,\n          aiChats: aiChatsCount,\n          pendingChats: pendingChatsCount\n        }))'
);


fs.writeFileSync('src/pages/Dashboard.jsx', code);
console.log('Update script finished successfully.');
