import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTenant } from '../lib/useTenant'
import { supabase } from '../lib/supabase'
import {
  Download, Clock, Users, DollarSign, Target, ArrowUpRight,
  TrendingUp, Inbox as InboxIcon, FileSpreadsheet
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { money, moneyCompact, count, percent, toNumber } from '../lib/format'

const PERIODS = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mes', days: 30 },
  { id: 'quarter', label: 'Trimestre', days: 90 },
  { id: 'year', label: 'Año', days: 365 },
]

const STAGE_ORDER = ['Nuevo', 'Contactado', 'Interesado', 'Negociación', 'Venta Cerrada', 'Venta Perdida']
const STAGE_COLORS = {
  Nuevo: '#a78bfa',
  Contactado: '#60a5fa',
  Interesado: '#818cf8',
  Negociación: '#f59e0b',
  'Venta Cerrada': '#10b981',
  'Venta Perdida': '#f43f5e',
}

const startOfPeriod = (periodId) => {
  const p = PERIODS.find(x => x.id === periodId) || PERIODS[3]
  const now = new Date()
  if (periodId === 'year') return new Date(now.getFullYear(), 0, 1)
  const d = new Date(now)
  d.setDate(d.getDate() - p.days)
  d.setHours(0, 0, 0, 0)
  return d
}

const monthKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '')
}

function EmptyChart({ label = 'Sin datos en este periodo' }) {
  return (
    <div style={{
      height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, color: 'var(--text-tertiary)',
    }}>
      <TrendingUp size={26} opacity={0.5} />
      <span style={{ fontSize: '0.85rem' }}>{label}</span>
    </div>
  )
}

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(22, 22, 31, 0.96)', border: '1px solid rgba(var(--overlay-rgb), 0.1)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', margin: 0, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const { clientId, isLoading: tenantLoading } = useTenant()
  const [period, setPeriod] = useState('year')
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [leads, setLeads] = useState([])
  const [avgResponseMin, setAvgResponseMin] = useState(null)

  const loadData = useCallback(async () => {
    if (!clientId) return
    setIsLoading(true)
    const from = startOfPeriod(period).toISOString()

    const [ordersRes, leadsRes] = await Promise.all([
      supabase.from('orders').select('*').eq('client_id', clientId).gte('created_at', from),
      supabase.from('leads').select('id, stage, source, value, created_at, assigned_to').eq('client_id', clientId).gte('created_at', from),
    ])

    if (!ordersRes.error) setOrders(ordersRes.data || [])
    if (!leadsRes.error) setLeads(leadsRes.data || [])

    // Tiempo de respuesta: primera respuesta del asesor tras el primer mensaje del cliente.
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select('messages')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
        .limit(60)

      const gaps = []
      for (const c of convs || []) {
        const msgs = Array.isArray(c.messages) ? c.messages : []
        const firstUser = msgs.find(m => m.role === 'user' && m.timestamp)
        if (!firstUser) continue
        const firstAgent = msgs.find(m => (m.role === 'agent' || m.role === 'assistant') &&
          m.timestamp && new Date(m.timestamp) > new Date(firstUser.timestamp))
        if (!firstAgent) continue
        const gap = (new Date(firstAgent.timestamp) - new Date(firstUser.timestamp)) / 60000
        if (gap > 0 && gap < 60 * 24 * 7) gaps.push(gap)
      }
      if (gaps.length) {
        gaps.sort((a, b) => a - b)
        setAvgResponseMin(Math.round(gaps[Math.floor(gaps.length / 2)]))
      } else {
        setAvgResponseMin(null)
      }
    } catch {
      setAvgResponseMin(null)
    }

    setIsLoading(false)
  }, [clientId, period])

  useEffect(() => {
    if (!tenantLoading && clientId) loadData()
  }, [tenantLoading, clientId, loadData])

  const stats = useMemo(() => {
    const revenue = orders.reduce((acc, o) => acc + toNumber(o.total ?? o.amount), 0)
    const ordersCount = orders.length
    const leadsCount = leads.length
    const won = leads.filter(l => l.stage === 'Venta Cerrada').length
    const conversion = leadsCount > 0 ? (won / leadsCount) * 100 : 0
    const ticket = ordersCount > 0 ? revenue / ordersCount : 0
    return { revenue, ordersCount, leadsCount, won, conversion, ticket }
  }, [orders, leads])

  const funnel = useMemo(() => STAGE_ORDER.map(stage => ({
    stage,
    total: leads.filter(l => (l.stage || 'Nuevo') === stage).length,
    fill: STAGE_COLORS[stage],
  })), [leads])

  const monthly = useMemo(() => {
    const buckets = new Map()
    for (const o of orders) {
      const key = monthKey(o.created_at)
      buckets.set(key, (buckets.get(key) || 0) + toNumber(o.total ?? o.amount))
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ month: monthLabel(key), total: value }))
  }, [orders])

  const bySource = useMemo(() => {
    const map = new Map()
    for (const l of leads) {
      const source = l.source || 'Sin fuente'
      const row = map.get(source) || { source, leads: 0, won: 0, revenue: 0 }
      row.leads += 1
      if (l.stage === 'Venta Cerrada') {
        row.won += 1
        row.revenue += toNumber(l.value)
      }
      map.set(source, row)
    }
    return [...map.values()]
      .map(r => ({ ...r, conversion: r.leads ? (r.won / r.leads) * 100 : 0 }))
      .sort((a, b) => b.leads - a.leads)
  }, [leads])

  const exportCsv = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Periodo', PERIODS.find(p => p.id === period)?.label || period],
      ['Ingresos (facturado)', money(stats.revenue)],
      ['Órdenes', stats.ordersCount],
      ['Ticket promedio', money(stats.ticket)],
      ['Leads nuevos', stats.leadsCount],
      ['Conversión', percent(stats.conversion)],
      [],
      ['Fuente', 'Leads', 'Cerradas', 'Conversión', 'Revenue'],
      ...bySource.map(s => [s.source, s.leads, s.won, percent(s.conversion), money(s.revenue)]),
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasOrders = orders.length > 0
  const hasLeads = leads.length > 0

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div>
          <h1 className="page-title">Reportes y Analítica</h1>
          <p className="page-subtitle">Análisis completo del rendimiento comercial</p>
        </div>
        <div className="header-actions">
          <div className="segmented-control">
            {PERIODS.map(p => (
              <button
                key={p.id}
                className={`btn btn-sm ${period === p.id ? '' : 'btn-ghost'}`}
                style={period === p.id ? { background: 'var(--primary-600)', color: '#fff' } : {}}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={!hasOrders && !hasLeads}>
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <div className="stat-card emerald animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Ingresos facturados</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">{money(stats.revenue)}</div>
          <div className="stat-card-change">
            <ArrowUpRight size={14} /> {count(stats.ordersCount)} órdenes en el periodo
          </div>
        </div>

        <div className="stat-card purple animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasa de conversión</span>
            <div className="stat-card-icon purple"><Target size={20} /></div>
          </div>
          <div className="stat-card-value">{percent(stats.conversion)}</div>
          <div className="stat-card-change">
            {count(stats.won)} de {count(stats.leadsCount)} leads cerrados
          </div>
        </div>

        <div className="stat-card sky animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Ticket promedio</span>
            <div className="stat-card-icon sky"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">{money(stats.ticket)}</div>
          <div className="stat-card-change">Por orden facturada</div>
        </div>

        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Leads nuevos</span>
            <div className="stat-card-icon amber"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{count(stats.leadsCount)}</div>
          <div className="stat-card-change">
            <Clock size={14} /> Respuesta: {avgResponseMin === null ? 'sin datos' : avgResponseMin < 1 ? 'menos de 1 min' : `${avgResponseMin} min`}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="reports-grid">
        <div className="chart-card animate-slideUp stagger-3">
          <div className="card-header">
            <h3 className="card-title">Embudo por etapa</h3>
          </div>
          {hasLeads ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnel} layout="vertical" barSize={20} margin={{ top: 8, right: 24, bottom: 8, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--overlay-rgb), 0.06)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} width={104} />
                <Tooltip content={<ChartTooltip formatter={v => `${count(v)} leads`} />} />
                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                  {funnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Aún no hay leads en este periodo" />
          )}
        </div>

        <div className="chart-card animate-slideUp stagger-4">
          <div className="card-header">
            <h3 className="card-title">Facturación por mes</h3>
          </div>
          {hasOrders ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--overlay-rgb), 0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickFormatter={moneyCompact} width={72} />
                <Tooltip content={<ChartTooltip formatter={money} />} />
                <Bar dataKey="total" name="Facturado" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Aún no hay ventas en este periodo" />
          )}
        </div>
      </div>

      <div className="chart-card animate-slideUp stagger-5">
        <div className="card-header">
          <h3 className="card-title">Análisis por fuente</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            <FileSpreadsheet size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {hasLeads ? `${bySource.length} fuentes activas` : 'Sin datos'}
          </span>
        </div>
        {hasLeads ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fuente</th>
                <th>Leads</th>
                <th>Cerradas</th>
                <th>Conversión</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map(s => (
                <tr key={s.source}>
                  <td style={{ fontWeight: 600 }}>{s.source}</td>
                  <td>{count(s.leads)}</td>
                  <td>{count(s.won)}</td>
                  <td>
                    <span className={`badge ${s.conversion >= 30 ? 'emerald' : s.conversion >= 10 ? 'amber' : 'rose'}`}>
                      {percent(s.conversion)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{money(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '32px 0' }}>
            <EmptyChart label="Aún no hay leads para analizar por fuente" />
          </div>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          Actualizando datos…
        </div>
      )}
    </div>
  )
}
