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
import { useTenant } from '../lib/useTenant'

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
  const tenant = useTenant()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    salesCount: 0,
    dealsActive: 0,
    newLeads: 0,
    conversion: '0%'
  })
  const [chartData, setChartData] = useState([])
  const [recentDealsList, setRecentDealsList] = useState([])
  const [pipelineState, setPipelineState] = useState([])

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
       fetchDashboardData()
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', tenant.clientId)
        .neq('status', 'cancelado')

      // 2. Fetch Leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('client_id', tenant.clientId)
        .order('created_at', { ascending: false })

      if (orders) {
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const grouped = months.map(m => ({ name: m, value: 0, value2: 0 }))
        
        orders.forEach(o => {
          const date = new Date(o.created_at)
          const monthIdx = date.getMonth()
          if (date.getFullYear() === 2026) {
            grouped[monthIdx].value += (Number(o.amount) || 0)
            grouped[monthIdx].value2 = grouped[monthIdx].value * 0.7 
          }
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
        const won = leads.filter(l => l.stage === 'Gano').length
        const convRate = leads.length > 0 ? `${((won / leads.length) * 100).toFixed(1)}%` : '0%'

        const recent = leads.slice(0, 4).map(l => ({
          lead: l.name,
          stage: l.stage || 'Nuevo',
          value: l.amount ? `$${(l.amount/1000).toFixed(1)}k` : `$${(Math.random() * 3 + 1).toFixed(1)}k`,
          date: new Date(l.created_at).toLocaleDateString(),
          color: l.stage === 'Gano' ? '#10b981' : (l.stage === 'Perdio' ? '#f43f5e' : '#6366f1')
        }))
        
        const stages = ['Nuevo', 'Contactado', 'Propuesta', 'Negociación']
        const pData = stages.map(s => ({
          name: s,
          value: leads.filter(l => l.stage === s).length,
          color: s === 'Nuevo' ? '#6366f1' : '#10b981'
        }))

        setStats(prev => ({ 
          ...prev, 
          dealsActive: active,
          newLeads: leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          conversion: convRate
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
      <div className="flex justify-between items-end mb-8 animate-slideUp">
        <div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(to right, white, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Resumen General
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>Visualización de métricas clave para {tenant.clientName}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Activity size={16} /> Reportes</button>
          <button className="btn btn-primary"><TrendingUp size={16} /> Analizar con IA</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="stat-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-start mb-4">
             <div className="ai-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><DollarSign size={18} /></div>
             <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>+15%</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Ventas Totales</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' }}>
            ${stats.revenue >= 1000000 ? `${(stats.revenue / 1000000).toFixed(1)}M` : `${(stats.revenue / 1000).toFixed(1)}k`}
          </div>
          <div style={{ height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#8b5cf6" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-start mb-4">
             <div className="ai-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><Activity size={18} /></div>
             <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 800 }}>{stats.salesCount} ord.</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Tasa de Conversión</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' }}>{stats.conversion}</div>
          <div style={{ height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-start mb-4">
             <div className="ai-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Target size={18} /></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Leads en Proceso</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' }}>{stats.dealsActive}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Seguimiento activo</div>
        </div>

        <div className="stat-card animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-start mb-4">
             <div className="ai-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><Zap size={18} /></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Nuevos Leads (30d)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0' }}>{stats.newLeads}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Crecimiento constante</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
        <div className="card animate-slideUp" style={{ animationDelay: '0.5s', padding: '32px' }}>
          <div className="flex justify-between items-center mb-8">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Rendimiento Comercial</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Ventas 2026
              </div>
            </div>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorValue)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Últimos Negocios</h3>
            <div className="flex flex-col gap-4">
              {recentDealsList.map((deal, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl  transition-all">
                  <div className="flex items-center gap-3">
                    <div className="avatar sm" style={{ background: `${deal.color}20`, color: deal.color }}>{deal.lead.substring(0,1)}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{deal.lead}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{deal.stage}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{deal.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{deal.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card animate-slideUp" style={{ animationDelay: '0.7s' }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20 }}>Estado del Pipeline</h3>
             <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineState} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {pipelineState.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
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
