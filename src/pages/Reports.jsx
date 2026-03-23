import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  BarChart3, Calendar, Download, Filter, TrendingUp, TrendingDown,
  Users, DollarSign, Clock, Target, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const conversionData = []
const salesByPeriod = []
const responseTimeData = []
const sourceAnalysis = []
const vendorPerformance = []

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
          <p key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const { session } = useOutletContext()
  const [period, setPeriod] = useState('year')
  const [metrics, setMetrics] = useState({
    leads: 0,
    revenue: 0,
    conversion: '0%',
    avgResponse: '0 min'
  })

  useEffect(() => {
    if (session?.user) {
      fetchReportMetrics()
    }
  }, [session, period])

  const fetchReportMetrics = async () => {
    // Lead Count
    const { count: leadCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    // Total Revenue
    const { data: revData } = await supabase
      .from('clients')
      .select('revenue')
      .eq('user_id', session.user.id)
    
    const totalRev = revData?.reduce((acc, curr) => acc + (curr.revenue || 0), 0) || 0

    setMetrics({
      leads: leadCount || 0,
      revenue: totalRev,
      conversion: leadCount > 0 ? '12.5%' : '0%', // Mocked for now
      avgResponse: '2.5 min' // Mocked
    })
  }

  // Prevent crashes from undefined variables used in charts
  const currentConversionData = []
  const currentSalesData = []
  const responseTimeData = []
  const sourceAnalysis = []
  const vendorPerformance = []

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Reportes y Analítica</h1>
            <p className="page-subtitle">Análisis completo del rendimiento comercial</p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-default)' }}>
              {['week', 'month', 'quarter', 'year'].map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${period === p ? '' : 'btn-ghost'}`}
                  style={period === p ? { background: 'var(--primary-600)', color: 'white' } : {}}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : p === 'quarter' ? 'Trimestre' : 'Año'}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <div className="stat-card purple animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasa de Conversión</span>
            <div className="stat-card-icon purple"><Target size={20} /></div>
          </div>
          <div className="stat-card-value">{metrics.conversion}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> +3.2% vs periodo anterior</div>
        </div>
        <div className="stat-card emerald animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">${metrics.revenue.toLocaleString()}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> Actualizado hoy</div>
        </div>
        <div className="stat-card sky animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Tiempo de Respuesta</span>
            <div className="stat-card-icon sky"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">{metrics.avgResponse}</div>
          <div className="stat-card-change positive"><ArrowDownRight size={14} /> -1.2 min (mejora)</div>
        </div>
        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Leads Nuevos</span>
            <div className="stat-card-icon amber"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{metrics.leads}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> +12.5%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="reports-grid">
        <div className="chart-card animate-slideUp stagger-3">
          <div className="card-header">
            <h3 className="card-title">Embudo de Conversión</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={currentConversionData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" stroke="#6b6b80" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b6b80" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {currentConversionData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card animate-slideUp stagger-4">
          <div className="card-header">
            <h3 className="card-title">Ventas vs Objetivo</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={currentSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="#6b6b80" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b6b80" tick={{ fontSize: 11 }} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Actual" />
              <Line type="monotone" dataKey="objetivo" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Objetivo" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="reports-grid">
        <div className="chart-card animate-slideUp stagger-5">
          <div className="card-header">
            <h3 className="card-title">Tiempo de Respuesta Promedio</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={responseTimeData}>
              <defs>
                <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" stroke="#6b6b80" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b6b80" tick={{ fontSize: 11 }} tickFormatter={v => `${v} min`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tiempo" stroke="#06b6d4" strokeWidth={2.5} fill="url(#responseGradient)" name="Tiempo" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card animate-slideUp stagger-6">
          <div className="card-header">
            <h3 className="card-title">Análisis por Fuente</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fuente</th>
                <th>Leads</th>
                <th>Conversión</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sourceAnalysis.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                      <span style={{ fontWeight: 600 }}>{s.source}</span>
                    </div>
                  </td>
                  <td>{s.leads.toLocaleString()}</td>
                  <td><span className={`badge ${s.conversion >= 30 ? 'emerald' : s.conversion >= 20 ? 'amber' : 'rose'}`}>{s.conversion}%</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{s.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="chart-card animate-slideUp" style={{ marginTop: 0 }}>
        <div className="card-header">
          <h3 className="card-title">Rendimiento de Vendedores</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Deals Cerrados</th>
              <th>Conversión</th>
              <th>Revenue</th>
              <th>Tiempo Resp.</th>
              <th>Satisfacción</th>
            </tr>
          </thead>
          <tbody>
            {vendorPerformance.map((v, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar sm" style={{ background: v.bg }}>{v.avatar}</div>
                    <span style={{ fontWeight: 600 }}>{v.name}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{v.deals}</td>
                <td><span className="badge emerald">{v.conversion}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{v.revenue}</td>
                <td>{v.response}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 48, height: 5, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${v.satisfaction}%`, height: '100%', background: v.satisfaction >= 95 ? '#10b981' : '#f59e0b', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{v.satisfaction}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
