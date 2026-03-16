import {
  Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ExternalLink, Clock, UserPlus, MessageSquare, ShoppingCart
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const revenueData = [
  { month: 'Ene', revenue: 42000, deals: 18 },
  { month: 'Feb', revenue: 38000, deals: 22 },
  { month: 'Mar', revenue: 55000, deals: 28 },
  { month: 'Abr', revenue: 49000, deals: 24 },
  { month: 'May', revenue: 62000, deals: 32 },
  { month: 'Jun', revenue: 58000, deals: 29 },
  { month: 'Jul', revenue: 71000, deals: 35 },
  { month: 'Ago', revenue: 68000, deals: 31 },
  { month: 'Sep', revenue: 79000, deals: 38 },
  { month: 'Oct', revenue: 85000, deals: 42 },
  { month: 'Nov', revenue: 91000, deals: 45 },
  { month: 'Dic', revenue: 98000, deals: 48 },
]

const sourceData = [
  { name: 'WhatsApp', value: 35, color: '#25d366' },
  { name: 'Instagram', value: 25, color: '#e1306c' },
  { name: 'Formularios', value: 20, color: '#6366f1' },
  { name: 'Facebook', value: 12, color: '#0084ff' },
  { name: 'Email', value: 8, color: '#f59e0b' },
]

const pipelineData = [
  { stage: 'Nuevo', count: 45, value: 180000, color: '#6366f1' },
  { stage: 'Contactado', count: 32, value: 128000, color: '#06b6d4' },
  { stage: 'Interesado', count: 24, value: 148000, color: '#8b5cf6' },
  { stage: 'Negociación', count: 18, value: 216000, color: '#f59e0b' },
  { stage: 'Cerrado', count: 12, value: 156000, color: '#10b981' },
]

const recentActivities = [
  { id: 1, type: 'lead', icon: UserPlus, text: 'Nuevo lead: María González desde WhatsApp', time: 'Hace 5 min', color: '#10b981' },
  { id: 2, type: 'message', icon: MessageSquare, text: 'Conversación escalada: Juan Pérez solicita hablar con humano', time: 'Hace 12 min', color: '#f59e0b' },
  { id: 3, type: 'sale', icon: ShoppingCart, text: 'Venta cerrada: Plan Enterprise - $12,500', time: 'Hace 25 min', color: '#6366f1' },
  { id: 4, type: 'lead', icon: UserPlus, text: 'Nuevo lead: Empresa Tech desde formulario web', time: 'Hace 32 min', color: '#10b981' },
  { id: 5, type: 'message', icon: MessageSquare, text: 'Intención de compra detectada: Ana Rodríguez', time: 'Hace 45 min', color: '#ec4899' },
  { id: 6, type: 'sale', icon: DollarSign, text: 'Pago recibido: Invoice #1042 - $8,200', time: 'Hace 1 hora', color: '#06b6d4' },
]

const topSellers = [
  { name: 'Ana Rodríguez', deals: 23, revenue: '$45,200', avatar: 'AR', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { name: 'Miguel Torres', deals: 19, revenue: '$38,700', avatar: 'MT', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { name: 'Laura Méndez', deals: 17, revenue: '$34,100', avatar: 'LM', bg: 'linear-gradient(135deg, #06b6d4, #10b981)' },
  { name: 'Diego Salazar', deals: 14, revenue: '$28,500', avatar: 'DS', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
]

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
  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del rendimiento comercial</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Leads</span>
            <div className="stat-card-icon purple"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">2,847</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> +12.5% vs mes anterior
          </div>
        </div>

        <div className="stat-card cyan animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Deals Activos</span>
            <div className="stat-card-icon cyan"><Target size={20} /></div>
          </div>
          <div className="stat-card-value">156</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> +8.3% vs mes anterior
          </div>
        </div>

        <div className="stat-card emerald animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue del Mes</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">$98,400</div>
          <div className="stat-card-change positive">
            <ArrowUpRight size={14} /> +23.1% vs mes anterior
          </div>
        </div>

        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasa Conversión</span>
            <div className="stat-card-icon amber"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">24.8%</div>
          <div className="stat-card-change negative">
            <ArrowDownRight size={14} /> -2.1% vs mes anterior
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card animate-slideUp stagger-3">
          <div className="card-header">
            <h3 className="card-title">Revenue Mensual</h3>
            <button className="btn btn-ghost btn-sm">
              <ExternalLink size={16} />
            </button>
          </div>
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
            <h3 className="card-title">Origen de Leads</h3>
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

      {/* Pipeline Funnel + Activities */}
      <div className="charts-grid">
        <div className="chart-card animate-slideUp stagger-5">
          <div className="card-header">
            <h3 className="card-title">Embudo de Ventas</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineData} layout="vertical" barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="#6b6b80" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="stage" stroke="#6b6b80" tick={{ fontSize: 12 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card animate-slideUp stagger-6" style={{ maxHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Actividad Reciente</h3>
            <button className="btn btn-ghost btn-sm">Ver todo</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border-default)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${activity.color}18`,
                  color: activity.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <activity.icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{activity.text}</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={11} /> {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Sellers */}
      <div className="chart-card animate-slideUp" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Top Vendedores del Mes</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendedor</th>
              <th>Deals Cerrados</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topSellers.map((seller, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: 'var(--text-tertiary)', width: 40 }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar sm" style={{ background: seller.bg }}>{seller.avatar}</div>
                    <span style={{ fontWeight: 600 }}>{seller.name}</span>
                  </div>
                </td>
                <td>{seller.deals}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{seller.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
