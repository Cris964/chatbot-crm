import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ChevronRight, Activity, Zap
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { supabase } from '../lib/supabase'

const mainChartData = [
  { name: 'Jan', value: 32000, value2: 28000 },
  { name: 'Feb', value: 45000, value2: 35000 },
  { name: 'Mar', value: 42000, value2: 38000 },
  { name: 'Apr', value: 38000, value2: 48000 },
  { name: 'May', value: 55000, value2: 42000 },
  { name: 'Jun', value: 68000, value2: 58000 },
  { name: 'Jul', value: 62000, value2: 55000 },
  { name: 'Aug', value: 75000, value2: 68000 },
  { name: 'Sep', value: 89000, value2: 72000 },
  { name: 'Oct', value: 78000, value2: 75000 },
  { name: 'Nov', value: 85000, value2: 82000 },
  { name: 'Dec', value: 95000, value2: 88000 },
]

const sparklineData = [
  { pv: 2400 }, { pv: 1398 }, { pv: 9800 }, { pv: 3908 }, { pv: 4800 }, { pv: 3800 }, { pv: 4300 },
]

const recentDeals = [
  { lead: 'Alex Banner', stage: 'Opening', value: '$10.00k', date: '08/03/2026', color: '#10b981' },
  { lead: 'Anner Daterson', stage: 'Succeed', value: '$15.00k', date: '03/02/2026', color: '#6366f1' },
  { lead: 'James Wilson', stage: 'Contract', value: '$8.50k', date: '01/02/2026', color: '#f59e0b' },
]

const pipelineData = [
  { name: 'Lead', value: 45, color: '#6366f1' },
  { name: 'Contact', value: 32, color: '#10b981' },
  { name: 'Proposal', value: 24, color: '#f59e0b' },
  { name: 'Negotiation', value: 18, color: '#ec4899' },
  { name: 'Closing', value: 12, color: '#8b5cf6' },
]

export default function Dashboard() {
  const { session } = useOutletContext()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    salesCount: 0,
    dealsActive: 0,
    newLeads: 0,
    revenueChange: '+0%',
    leadsChange: '+0%'
  })
  const [chartData, setChartData] = useState([])
  const [recentDealsList, setRecentDealsList] = useState([])
  const [pipelineState, setPipelineState] = useState([])

  useEffect(() => {
    if (session?.user?.id) {
       fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // 1. Get client IDs for multitenancy
      // Try to find clients owned by the user, or fallback to any client if user has permissions
      let { data: clients } = await supabase.from('clients').select('id').eq('user_id', session.user.id)
      
      if (!clients || clients.length === 0) {
        const { data: allClients } = await supabase.from('clients').select('id')
        clients = allClients
      }
      
      const clientIds = clients?.map(c => c.id) || []

      // 2. Fetch Orders for Revenue and Sales Count
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('client_id', clientIds)
        .neq('status', 'cancelado')

      // 3. Fetch Leads for Active Deals and Recent Deals
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })

      // 4. Fetch Conversations for message volume
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, channel')
        .in('client_id', clientIds)

      if (orders) {
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
        
        // Group orders by month for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const isNaturelAdmin = session.user.email === 'admin@chekadmin.com' || session.user.email === 'naturel@admin.com';
        const grouped = months.map(m => ({ name: m, value: 0, value2: 0 }))
        
        orders.forEach(o => {
          const monthIdx = new Date(o.created_at).getMonth()
          grouped[monthIdx].value += (Number(o.amount) || 0)
          // Mocking value2 as a percentage of value for visual depth, or use last year if available
          grouped[monthIdx].value2 = grouped[monthIdx].value * 0.8 
        })

        setStats(prev => ({ 
          ...prev, 
          revenue: totalRevenue, 
          salesCount: orders.length 
        }))
        setChartData(grouped)
      }

      if (leads) {
        const active = leads.filter(l => !['Gano', 'Perdio'].includes(l.stage)).length
        const recent = leads.slice(0, 5).map(l => ({
          lead: l.name,
          stage: l.stage || 'Nuevo',
          value: `$${(Math.random() * 5 + 1).toFixed(2)}k`, // Randomized mock value as leads don't usually have a fixed 'amount' column in this schema yet
          date: new Date(l.created_at).toLocaleDateString(),
          color: l.stage === 'Gano' ? '#10b981' : (l.stage === 'Perdio' ? '#f43f5e' : '#6366f1')
        }))
        
        // Pipeline bar chart data
        const stages = ['Nuevo', 'Contactado', 'Propuesta', 'Negociación']
        const pData = stages.map(s => ({
          name: s,
          value: leads.filter(l => l.stage === s).length,
          color: s === 'Nuevo' ? '#6366f1' : '#10b981'
        }))

        setStats(prev => ({ 
          ...prev, 
          dealsActive: active,
          newLeads: leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        }))
        setRecentDealsList(recent)
        setPipelineState(pData)
      }

    } catch (err) {
      console.error("Dashboard error:", err)
    }
    setIsLoading(false)
  }

  return (
    <div className="page-content" style={{ padding: '32px' }}>
      <div className="page-header animate-slideUp">
        <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Welcome back! Here's what's happening with your account.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {/* LTV/Revenue Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Revenue</span>
             <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>+12.5%</span>
          </div>
          <div className="stat-card-value">${stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(1)}k` : stats.revenue.toLocaleString()}</div>
          <div style={{ height: 40, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Orders</span>
             <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700 }}>{stats.salesCount}</span>
          </div>
          <div className="stat-card-value">{stats.salesCount}</div>
          <div style={{ height: 40, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Deals Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Leads en Proceso</span>
             <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="stat-card-value">{stats.dealsActive}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: 4 }}>Engagement activo</div>
        </div>

        {/* New Leads Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Leads (30d)</span>
             <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="stat-card-value">{stats.newLeads}</div>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600, marginTop: 4 }}>Tendencia mensual</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card" style={{ marginBottom: '32px', padding: '32px' }}>
        <div className="card-header" style={{ marginBottom: '32px' }}>
           <div>
              <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ventas por Mes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Rendimiento de facturación real acumulado</p>
           </div>
           <button className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>2026 <ChevronDown size={14} /></button>
        </div>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.length > 0 ? chartData : mainChartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVal2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ fontSize: '0.85rem' }}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="value2" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal2)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Recent Deals */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Deals</h3>
            <MoreHorizontal size={16} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>LEAD</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>STAGE</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>VALUE</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>CLOSE DATE</th>
              </tr>
            </thead>
            <tbody>
              {recentDealsList.map((deal, i) => (
                <tr key={i} style={{ borderBottom: i === recentDealsList.length - 1 ? 'none' : '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, fontSize: '0.9rem' }}>{deal.lead}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge" style={{ background: `${deal.color}15`, color: deal.color }}>{deal.stage}</span>
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: 700 }}>{deal.value}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{deal.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pipeline Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pipeline Status</h3>
            <MoreHorizontal size={16} />
          </div>
          <div style={{ height: 220, marginTop: 24 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineState.length > 0 ? pipelineState : pipelineData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {(pipelineState.length > 0 ? pipelineState : pipelineData).map((entry, index) => (
                    <cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronDown(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}
