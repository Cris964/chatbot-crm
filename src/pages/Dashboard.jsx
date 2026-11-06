import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  DollarSign, Users, Target, TrendingUp, Clock, AlertTriangle, Package,
  ShoppingCart, Percent, ArrowUpRight, ArrowDownRight, Minus, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { supabase } from '../lib/supabase'
import { fetchAll } from '../lib/query'
import { useTenant } from '../lib/useTenant'
import { money, moneyCompact, count, percent, toNumber } from '../lib/format'

const PERIODS = [
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
  { id: '12m', label: '12 meses', days: 365 },
]

const OPEN_STAGES = ['Nuevo', 'Contactado', 'Interesado', 'Negociación']
const STAGE_PROB = { Nuevo: 0.1, Contactado: 0.2, Interesado: 0.4, Negociación: 0.7 }
const STAGE_COLORS = {
  Nuevo: '#a78bfa',
  Contactado: '#60a5fa',
  Interesado: '#818cf8',
  Negociación: '#f59e0b',
  'Venta Cerrada': '#10b981',
  'Venta Perdida': '#f43f5e',
}
const FUNNEL_STAGES = ['Nuevo', 'Contactado', 'Interesado', 'Negociación', 'Venta Cerrada', 'Venta Perdida']

const startOf = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (date) =>
  date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')

const orderTotal = (o) => toNumber(o.total ?? o.amount)
const orderDate = (o) => new Date(o.created_at)

function Skeleton({ h = 22, w = '70%' }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: 8, marginTop: 10 }} />
}

function Delta({ value }) {
  if (value === null) return <span style={{ color: 'var(--text-tertiary)' }}>sin datos del periodo anterior</span>
  const flat = Math.abs(value) < 0.5
  const up = value > 0
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const color = flat ? 'var(--text-tertiary)' : up ? 'var(--accent-emerald, #10b981)' : 'var(--accent-red, #ef4444)'
  return (
    <span style={{ color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={14} /> {flat ? 'igual' : `${Math.abs(value).toFixed(1)}%`} vs periodo anterior
    </span>
  )
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(22,22,31,0.96)', border: '1px solid rgba(var(--overlay-rgb), 0.12)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <p style={{ margin: 0, marginBottom: 4, color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || p.fill, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const tenant = useTenant()
  const { session } = useOutletContext() || {}
  const navigate = useNavigate()

  const [period, setPeriod] = useState('90d')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [orders, setOrders] = useState([])
  const [leads, setLeads] = useState([])
  const [avgFirstReply, setAvgFirstReply] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [truncated, setTruncated] = useState(false)

  const days = PERIODS.find(p => p.id === period)?.days || 90

  const load = useCallback(async () => {
    if (!tenant.clientId || tenant.isLoading) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const from = startOf(365).toISOString()

      // Órdenes: son pocas (decenas), no necesitan paginación.
      const orderQuery = supabase
        .from('orders')
        .select('id, total, product, status, created_at, user_phone, user_name')
        .eq('client_id', tenant.clientId)
        .gte('created_at', from)
        .order('created_at', { ascending: false })
        .limit(2000)

      // Leads: Supabase corta en 1.000 filas, así que se pagina hasta traerlas todas.
      const leadsQuery = fetchAll(supabase, 'leads', 'id, stage, source, value, created_at', (q) =>
        q.eq('client_id', tenant.clientId).gte('created_at', from).order('created_at', { ascending: false })
      )

      const [ordersRes, leadsAll] = await Promise.all([orderQuery, leadsQuery])

      if (ordersRes.error) throw ordersRes.error

      setOrders((ordersRes.data || []).filter(o => (o.status || '').toLowerCase() !== 'cancelado'))
      setLeads(leadsAll.rows)
      setTruncated(leadsAll.truncated)
      setIsLoading(false)

      // El tiempo de respuesta NO bloquea el panel: se resuelve aparte.
      loadFirstReply()
    } catch (err) {
      console.error('Dashboard load error:', err)
      setLoadError(err.message || 'No se pudieron cargar las métricas')
      setIsLoading(false)
    } finally {
      setRefreshing(false)
    }
  }, [tenant.clientId, tenant.isLoading])

  // Mediana del primer reply. Consulta pesada (JSON de mensajes): va aparte y
  // nunca bloquea las tarjetas; si falla, simplemente se muestra "sin datos".
  const loadFirstReply = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('messages')
        .eq('client_id', tenant.clientId)
        .order('updated_at', { ascending: false })
        .limit(12)

      const gaps = []
      for (const c of data || []) {
        const msgs = Array.isArray(c.messages) ? c.messages : []
        const firstUser = msgs.find(m => m.role === 'user' && m.timestamp)
        if (!firstUser) continue
        const firstAgent = msgs.find(m => (m.role === 'agent' || m.role === 'assistant') &&
          m.timestamp && new Date(m.timestamp) > new Date(firstUser.timestamp))
        if (!firstAgent) continue
        const min = (new Date(firstAgent.timestamp) - new Date(firstUser.timestamp)) / 60000
        if (min > 0 && min < 60 * 24 * 7) gaps.push(min)
      }
      if (gaps.length) {
        gaps.sort((a, b) => a - b)
        setAvgFirstReply(gaps[Math.floor(gaps.length / 2)])
      } else {
        setAvgFirstReply(null)
      }
    } catch {
      setAvgFirstReply(null)
    }
  }, [tenant.clientId])

  useEffect(() => { load() }, [load])

  // ---------- series del periodo y del anterior ----------
  const series = useMemo(() => {
    const now = new Date()
    const start = startOf(days)
    const prevStart = startOf(days * 2)

    const inRange = (d, a, b) => d >= a && d < b

    const current = {
      orders: orders.filter(o => inRange(orderDate(o), start, now)),
      leads: leads.filter(l => l.created_at && inRange(new Date(l.created_at), start, now)),
    }
    const previous = {
      orders: orders.filter(o => inRange(orderDate(o), prevStart, start)),
      leads: leads.filter(l => l.created_at && inRange(new Date(l.created_at), prevStart, start)),
    }
    return { current, previous, start, prevStart }
  }, [orders, leads, days])

  const metrics = useMemo(() => {
    const revenue = (list) => list.reduce((acc, o) => acc + orderTotal(o), 0)
    const curRev = revenue(series.current.orders)
    const prevRev = revenue(series.previous.orders)
    const curCount = series.current.orders.length
    const prevCount = series.previous.orders.length
    const curLeads = series.current.leads.length
    const prevLeads = series.previous.leads.length

    const delta = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)

    const ticket = curCount ? curRev / curCount : 0
    const conversion = curLeads ? (curCount / curLeads) * 100 : 0

    // Pipeline ponderado: solo leads abiertos, con valor declarado.
    let weighted = 0
    let negotiation = 0
    let openLeads = 0
    let leadsWithoutValue = 0
    for (const l of leads) {
      const stage = l.stage || 'Nuevo'
      if (!OPEN_STAGES.includes(stage)) continue
      openLeads += 1
      const value = toNumber(l.value)
      if (!value) { leadsWithoutValue += 1; continue }
      weighted += value * (STAGE_PROB[stage] ?? 0.25)
      if (stage === 'Negociación') negotiation += value
    }

    // LTV = ticket promedio × compras por cliente (no es "revenue / clientes").
    const byBuyer = new Map()
    for (const o of orders) {
      const key = (o.user_phone || o.user_name || 'sin-id').toString().trim().toLowerCase()
      byBuyer.set(key, (byBuyer.get(key) || 0) + 1)
    }
    const buyers = byBuyer.size
    const ordersPerBuyer = buyers ? orders.length / buyers : 1
    const ltv = ticket * ordersPerBuyer
    const repeatRate = buyers ? ([...byBuyer.values()].filter(n => n > 1).length / buyers) * 100 : 0

    // Leads abiertos hace más de 48 h (no hay updated_at en leads).
    const stale = leads.filter(l => {
      if (!OPEN_STAGES.includes(l.stage || 'Nuevo')) return false
      const age = (Date.now() - new Date(l.created_at).getTime()) / 3600000
      return age > 48
    }).length

    return {
      revenue: curRev, revenueDelta: delta(curRev, prevRev),
      orders: curCount, ordersDelta: delta(curCount, prevCount),
      leads: curLeads, leadsDelta: delta(curLeads, prevLeads),
      ticket, conversion,
      weightedPipeline: weighted, negotiation, openLeads, leadsWithoutValue,
      ltv, repeatRate, buyers, stale,
    }
  }, [series, orders, leads])

  const monthly = useMemo(() => {
    const buckets = new Map()
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      buckets.set(monthKey(d), { key: monthKey(d), month: monthLabel(d), total: 0, ordenes: 0 })
    }
    for (const o of orders) {
      const k = monthKey(orderDate(o))
      const bucket = buckets.get(k)
      if (bucket) {
        bucket.total += orderTotal(o)
        bucket.ordenes += 1
      }
    }
    return [...buckets.values()]
  }, [orders])

  const funnel = useMemo(() => {
    const scoped = series.current.leads
    return FUNNEL_STAGES.map(stage => ({
      stage,
      total: scoped.filter(l => (l.stage || 'Nuevo') === stage).length,
      fill: STAGE_COLORS[stage],
    }))
  }, [series])

  const bySource = useMemo(() => {
    const map = new Map()
    for (const l of series.current.leads) {
      const key = l.source || 'Sin origen'
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()]
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [series])

  const topProducts = useMemo(() => {
    const map = new Map()
    for (const o of series.current.orders) {
      const raw = (o.product || 'Sin producto').trim()
      // Agrupa "PRENSA DE 20T" y "prensa 20 T" como el mismo producto.
      const key = raw.toLowerCase().replace(/\s+/g, ' ')
      const row = map.get(key) || { product: raw, total: 0, orders: 0 }
      row.total += orderTotal(o)
      row.orders += 1
      map.set(key, row)
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  }, [series])

  const maxSource = Math.max(1, ...bySource.map(s => s.total))
  const replyLabel = avgFirstReply === null ? 'sin datos'
    : avgFirstReply < 1 ? 'menos de 1 min'
      : avgFirstReply < 60 ? `${Math.round(avgFirstReply)} min`
        : `${(avgFirstReply / 60).toFixed(1)} h`

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <span className="eyebrow-chip">
            {tenant.clientName || 'Nexus CRM'} · Métricas ejecutivas
          </span>
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle">
            Ingresos, pipeline y conversión en tiempo real. Cada cifra sale de tus órdenes y leads.
          </p>
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
          <button
            className="btn btn-secondary"
            onClick={() => { setRefreshing(true); load() }}
            disabled={isLoading}
            title="Actualizar métricas"
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {loadError && (
        <div className="alert-inline">
          <AlertTriangle size={16} />
          <span style={{ flex: 1 }}>No pudimos cargar las métricas: {loadError}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => load()}>Reintentar</button>
        </div>
      )}

      {/* ---------- KPIs principales ---------- */}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Ingresos del periodo</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          {isLoading ? <Skeleton w="80%" /> : (
            <div className="stat-card-value">{money(metrics.revenue)}</div>
          )}
          <div className="stat-card-change">
            {isLoading ? <Skeleton h={12} w="60%" /> : <Delta value={metrics.revenueDelta} />}
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-card-header">
            <span className="stat-card-label">Órdenes</span>
            <div className="stat-card-icon purple"><ShoppingCart size={20} /></div>
          </div>
          {isLoading ? <Skeleton w="50%" /> : (
            <div className="stat-card-value">{count(metrics.orders)}</div>
          )}
          <div className="stat-card-change">
            {isLoading ? <Skeleton h={12} w="55%" /> : (
              <span>Ticket promedio: <strong>{money(metrics.ticket)}</strong></span>
            )}
          </div>
        </div>

        <div className="stat-card sky">
          <div className="stat-card-header">
            <span className="stat-card-label">Leads nuevos</span>
            <div className="stat-card-icon sky"><Users size={20} /></div>
          </div>
          {isLoading ? <Skeleton w="45%" /> : (
            <div className="stat-card-value">{count(metrics.leads)}</div>
          )}
          <div className="stat-card-change">
            {isLoading ? <Skeleton h={12} w="60%" /> : <Delta value={metrics.leadsDelta} />}
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Conversión</span>
            <div className="stat-card-icon amber"><Percent size={20} /></div>
          </div>
          {isLoading ? <Skeleton w="40%" /> : (
            <div className="stat-card-value">{percent(metrics.conversion)}</div>
          )}
          <div className="stat-card-change">
            {isLoading ? <Skeleton h={12} w="65%" /> : (
              <span>{count(metrics.orders)} órdenes sobre {count(metrics.leads)} leads</span>
            )}
          </div>
        </div>
      </div>

      {/* ---------- KPIs secundarios ---------- */}
      <div className="mini-grid">
        <div className="mini-card">
          <Target size={16} />
          <div>
            <span className="mini-label">Pipeline ponderado</span>
            <strong>
              {isLoading ? '—'
                : metrics.weightedPipeline > 0 ? moneyCompact(metrics.weightedPipeline)
                  : 'sin valor'}
            </strong>
            <em>
              {metrics.openLeads} leads abiertos
              {metrics.leadsWithoutValue > 0
                ? ` · ${count(metrics.leadsWithoutValue)} sin valor cargado`
                : ''}
            </em>
          </div>
        </div>

        <div className="mini-card">
          <TrendingUp size={16} />
          <div>
            <span className="mini-label">En negociación</span>
            <strong>{isLoading ? '—' : moneyCompact(metrics.negotiation)}</strong>
            <em>Etapa con 70 % de probabilidad</em>
          </div>
        </div>

        <div className="mini-card">
          <DollarSign size={16} />
          <div>
            <span className="mini-label">LTV estimado</span>
            <strong>{isLoading ? '—' : moneyCompact(metrics.ltv)}</strong>
            <em>Ticket × compras por cliente</em>
          </div>
        </div>

        <div className="mini-card">
          <Users size={16} />
          <div>
            <span className="mini-label">Recompra</span>
            <strong>{isLoading ? '—' : percent(metrics.repeatRate)}</strong>
            <em>{count(metrics.buyers)} clientes con compra</em>
          </div>
        </div>

        <div className="mini-card">
          <Clock size={16} />
          <div>
            <span className="mini-label">1ª respuesta</span>
            <strong>{isLoading ? '—' : replyLabel}</strong>
            <em>Mediana de los últimos chats</em>
          </div>
        </div>

        <div className={`mini-card ${metrics.stale > 0 ? 'warn' : ''}`}>
          <AlertTriangle size={16} />
          <div>
            <span className="mini-label">Leads sin seguimiento</span>
            <strong>{isLoading ? '—' : count(metrics.stale)}</strong>
            <em>Abiertos hace más de 48 h</em>
          </div>
        </div>
      </div>

      {/* ---------- Gráficas ---------- */}
      <div className="dash-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Ingresos por mes</h3>
            <span className="card-hint">Últimos 12 meses</span>
          </div>
          {isLoading ? (
            <div className="chart-skeleton" />
          ) : orders.length === 0 ? (
            <div className="chart-empty">
              <TrendingUp size={24} opacity={0.5} />
              <p>Aún no hay ventas registradas.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/ventas')}>
                Registrar la primera venta
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} barSize={26} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--overlay-rgb), 0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} tickFormatter={moneyCompact} width={72} />
                <Tooltip content={<ChartTooltip formatter={money} />} />
                <Bar dataKey="total" name="Facturado" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Embudo por etapa</h3>
            <span className="card-hint">{PERIODS.find(p => p.id === period)?.label}</span>
          </div>
          {isLoading ? (
            <div className="chart-skeleton" />
          ) : metrics.leads === 0 ? (
            <div className="chart-empty">
              <Users size={24} opacity={0.5} />
              <p>No hay leads en este periodo.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads')}>
                Crear un lead
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* ---------- Tablas ---------- */}
      <div className="dash-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Top productos</h3>
            <span className="card-hint">Por ingresos del periodo</span>
          </div>
          {isLoading ? (
            <div className="chart-skeleton" style={{ height: 160 }} />
          ) : topProducts.length === 0 ? (
            <p className="empty-line">Sin ventas en el periodo.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Producto</th><th>Órdenes</th><th>Ingresos</th></tr>
              </thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.product}>
                    <td style={{ fontWeight: 600 }}>
                      <Package size={13} style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.6 }} />
                      {p.product}
                    </td>
                    <td>{count(p.orders)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>{money(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Origen de los leads</h3>
            <span className="card-hint">Top 5 del periodo</span>
          </div>
          {isLoading ? (
            <div className="chart-skeleton" style={{ height: 160 }} />
          ) : bySource.length === 0 ? (
            <p className="empty-line">Sin leads en el periodo.</p>
          ) : (
            <div className="source-list">
              {bySource.map(s => (
                <div key={s.source} className="source-row">
                  <span className="source-name">{s.source}</span>
                  <div className="source-bar">
                    <div style={{ width: `${(s.total / maxSource) * 100}%` }} />
                  </div>
                  <span className="source-value">{count(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="dashboard-footnote">
        Datos de <code>orders</code> y <code>leads</code> del periodo seleccionado.
        El pipeline ponderado usa las probabilidades por etapa (10 / 20 / 40 / 70 %).
        Cada métrica ignora órdenes canceladas y leads sin valor declarado.
        {truncated && ' · Los leads superan las 20.000 filas: se muestran las más recientes.'}
      </p>
    </div>
  )
}
