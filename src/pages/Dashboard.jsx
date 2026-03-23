import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ExternalLink, Clock, UserPlus, MessageSquare, ShoppingCart
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { supabase } from '../lib/supabase'

const revenueData = [
  { month: 'Ene', revenue: 0, deals: 0 },
  { month: 'Feb', revenue: 0, deals: 0 },
  { month: 'Mar', revenue: 0, deals: 0 },
  // ... rest of month placeholders as needed
]

const sourceData = [
  { name: 'WhatsApp', value: 0, color: '#25d366' },
  { name: 'Instagram', value: 0, color: '#e1306c' },
  { name: 'Formularios', value: 0, color: '#6366f1' },
  { name: 'Facebook', value: 0, color: '#0084ff' },
  { name: 'Email', value: 0, color: '#f59e0b' },
]

const pipelineData = [
  { stage: 'Nuevo', count: 0, value: 0, color: '#6366f1' },
  { stage: 'Contactado', count: 0, value: 0, color: '#06b6d4' },
  { stage: 'Interesado', count: 0, value: 0, color: '#8b5cf6' },
  { stage: 'Negociación', count: 0, value: 0, color: '#f59e0b' },
  { stage: 'Cerrado', count: 0, value: 0, color: '#10b981' },
]

const topSellers = []

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(22, 22, 31, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)'
      }}>
        <p style={{ color: '#a1a1b5', fontSize: '0.78rem', marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.88rem', fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { session } = useOutletContext()
  const [stats, setStats] = useState({
    leads: 0,
    clients: 0,
    revenue: 0,
    conversion: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session?.user?.id])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    
    // Fetch Leads Count
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    // Fetch Clients Count
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    // Fetch Total Revenue/LTV from clients
    const { data: clientData } = await supabase
      .from('clients')
      .select('ltv')
      .eq('user_id', session.user.id)

    let totalRevenue = 0
    if (clientData) {
      totalRevenue = clientData.reduce((acc, client) => {
        const val = parseFloat((client.ltv || '$0').replace(/[^0-9.]/g, ''))
        return acc + (isNaN(val) ? 0 : val)
      }, 0)
    }

    setStats({
      leads: leadCount || 0,
      clients: clientCount || 0,
      revenue: totalRevenue,
      conversion: leadCount > 0 ? ((clientCount / leadCount) * 100).toFixed(1) : 0
    })

    // Diagnostic: Check table columns
    const { data: clientSample } = await supabase.from('clients').select('*').limit(1)
    if (clientSample && clientSample[0]) {
      console.log('DEBUG: Clients table columns:', Object.keys(clientSample[0]))
    }
    const { data: convSample } = await supabase.from('conversations').select('*').limit(1)
    if (convSample && convSample[0]) {
      console.log('DEBUG: Conversations table columns:', Object.keys(convSample[0]))
    }
    
    setIsLoading(false)
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de tu rendimiento comercial</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Leads</span>
            <div className="stat-card-icon purple"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{isLoading ? '...' : stats.leads.toLocaleString()}</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> Datos reales
          </div>
        </div>

        <div className="stat-card cyan animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Clientes Totales</span>
            <div className="stat-card-icon cyan"><UserPlus size={20} /></div>
          </div>
          <div className="stat-card-value">{isLoading ? '...' : stats.clients.toLocaleString()}</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> Datos reales
          </div>
        </div>

        <div className="stat-card emerald animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue Estimado (LTV)</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">{isLoading ? '...' : `$${stats.revenue.toLocaleString()}`}</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> Datos reales
          </div>
        </div>

        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasa Conversión</span>
            <div className="stat-card-icon amber"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">{isLoading ? '...' : `${stats.conversion}%`}</div>
          <div className="stat-card-change">
            Ratio Leads vs Clientes
          </div>
        </div>
      </div>

      {stats.leads === 0 && !isLoading && (
        <div className="card animate-slideUp stagger-5" style={{ padding: '4rem', textAlign: 'center', marginTop: 24 }}>
          <div style={{ background: 'var(--primary-600)18', color: 'var(--primary-400)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Target size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>¡Bienvenido a NexusCRM!</h2>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Parece que eres nuevo aquí. Todavía no tienes datos para mostrar en las gráficas, 
            pero puedes empezar añadiendo tu primer lead o conectando tus canales.
          </p>
          <div className="flex justify-center gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/leads')}>Ir a Leads</button>
            <button className="btn btn-secondary" onClick={() => navigate('/inbox')}>Ver Inbox</button>
          </div>
        </div>
      )}

      {stats.leads > 0 && (
        <>
          {/* Charts Row */}
          <div className="charts-grid">
            <div className="chart-card animate-slideUp stagger-3">
              <div className="card-header">
                <h3 className="card-title">Revenue Mensual (Placeholder)</h3>
                <button className="btn btn-ghost btn-sm">
                  <ExternalLink size={16} />
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>Gráfica de ejemplo con datos mensuales</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="#6b6b80" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b6b80" tick={{ fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    name="revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card animate-slideUp stagger-4">
              <div className="card-header">
                <h3 className="card-title">Origen de Leads (Placeholder)</h3>
                <button className="btn btn-ghost btn-sm">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                {sourceData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ color: '#a1a1b5' }}>{s.name}</span>
                    <span style={{ fontWeight: 700 }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
