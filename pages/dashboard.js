import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ============ ICONS ============
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: '◈', conversations: '💬', orders: '📦', clients: '🏢',
    settings: '⚙️', logout: '→', sun: '☀️', moon: '🌙', refresh: '↻',
    plus: '+', search: '🔍', check: '✓', edit: '✏️', save: '💾',
    close: '✕', live: '●', msg: '💬', user: '👤', bot: '🤖',
    trend: '📈', money: '💰', chat: '◉', new: '✨'
  }
  return <span style={{fontSize: size}}>{icons[name] || '●'}</span>
}

// ============ SIDEBAR ============
function Sidebar({ active, setActive, clients, selectedClient, setSelectedClient, toggleTheme, dark, onLogout }) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'conversations', label: 'Conversaciones', icon: 'conversations' },
    { id: 'orders', label: 'Pedidos', icon: 'orders' },
    { id: 'clients', label: 'Clientes Bot', icon: 'clients' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 dark:bg-[#111118] bg-white dark:border-white/5 border-gray-200 border-r flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b dark:border-white/5 border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white text-sm font-bold" style={{fontFamily:'Syne'}}>C</span>
          </div>
          <div>
            <div className="font-bold text-sm dark:text-white text-gray-900" style={{fontFamily:'Syne'}}>ChatBot<span className="text-brand-500">CRM</span></div>
            <div className="text-[10px] dark:text-gray-600 text-gray-400 uppercase tracking-widest">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Client Selector */}
      <div className="p-3 border-b dark:border-white/5 border-gray-100">
        <div className="text-[9px] uppercase tracking-widest dark:text-gray-600 text-gray-400 mb-2 px-1">Cliente activo</div>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50 cursor-pointer"
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              active === item.id
                ? 'bg-brand-500/10 text-brand-500 font-medium border border-brand-500/20'
                : 'dark:text-gray-500 text-gray-500 hover:dark:bg-white/5 hover:bg-gray-50 hover:dark:text-white hover:text-gray-800'
            }`}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t dark:border-white/5 border-gray-100 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs dark:text-gray-600 text-gray-400 hover:dark:text-white hover:text-gray-800 transition"
        >
          <Icon name={dark ? 'sun' : 'moon'} size={14} />
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition"
        >
          <Icon name="logout" size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// ============ STAT CARD ============
function StatCard({ label, value, icon, color, sub }) {
  const colors = {
    purple: 'from-brand-500/20 to-transparent border-brand-500/20 text-brand-500',
    green: 'from-emerald-500/20 to-transparent border-emerald-500/20 text-emerald-400',
    yellow: 'from-amber-500/20 to-transparent border-amber-500/20 text-amber-400',
    red: 'from-rose-500/20 to-transparent border-rose-500/20 text-rose-400',
  }
  return (
    <div className={`dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform`}>
      <div className={`absolute inset-0 bg-gradient-to-br opacity-40 ${colors[color]}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest dark:text-gray-500 text-gray-400">{label}</span>
          <span className="text-xl opacity-60">{icon}</span>
        </div>
        <div className={`text-4xl font-black tracking-tighter mb-1 ${colors[color].split(' ').pop()}`} style={{fontFamily:'Syne'}}>
          {value ?? <div className="skeleton h-10 w-20" />}
        </div>
        <div className="text-xs dark:text-gray-600 text-gray-400">{sub}</div>
      </div>
    </div>
  )
}

// ============ DASHBOARD PAGE ============
function DashboardPage({ clientId, clients }) {
  const [stats, setStats] = useState({})
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('conversations').select('id, messages, updated_at, user_name, client_id')
    if (clientId) query = query.eq('client_id', clientId)
    const { data: convs } = await query

    let oQuery = supabase.from('orders').select('id, created_at, client_id')
    if (clientId) oQuery = oQuery.eq('client_id', clientId)
    const { data: orders } = await oQuery

    const today = new Date().toDateString()
    const convsToday = (convs || []).filter(c => new Date(c.updated_at).toDateString() === today)
    const totalMsgs = (convs || []).reduce((a, c) => a + (c.messages?.length || 0), 0)

    setStats({
      convsToday: convsToday.length,
      totalOrders: orders?.length || 0,
      totalConvs: convs?.length || 0,
      totalMsgs,
    })

    // Chart data: last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toDateString()
      const dayConvs = (convs || []).filter(c => new Date(c.updated_at).toDateString() === ds).length
      const dayMsgs = (convs || []).filter(c => new Date(c.updated_at).toDateString() === ds)
        .reduce((a, c) => a + (c.messages?.length || 0), 0)
      days.push({ day: ['Do','Lu','Ma','Mi','Ju','Vi','Sa'][d.getDay()], convs: dayConvs, msgs: dayMsgs })
    }
    setChartData(days)
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

  const chartColor = '#7c5cfc'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight" style={{fontFamily:'Syne'}}>Dashboard</h1>
          <p className="text-sm dark:text-gray-500 text-gray-400 mt-0.5">Resumen en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-dot" />
            En vivo
          </div>
          <button onClick={load} className="text-xs dark:text-gray-500 text-gray-400 hover:text-brand-500 transition px-3 py-1.5 dark:bg-white/5 bg-gray-100 rounded-lg">
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Conversaciones hoy" value={stats.convsToday} icon="💬" color="purple" sub="Activas" />
        <StatCard label="Pedidos totales" value={stats.totalOrders} icon="📦" color="green" sub="Registrados" />
        <StatCard label="Total conversaciones" value={stats.totalConvs} icon="👥" color="yellow" sub="Histórico" />
        <StatCard label="Mensajes procesados" value={stats.totalMsgs} icon="⚡" color="red" sub="Por la IA" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-5">
          <div className="text-sm font-semibold dark:text-white text-gray-800 mb-4" style={{fontFamily:'Syne'}}>Conversaciones por día</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{fontSize:11, fill:'#6b7280'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'#1a1a24', border:'1px solid #ffffff10', borderRadius:8, fontSize:12}} />
              <Area type="monotone" dataKey="convs" stroke={chartColor} fill="url(#cg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-5">
          <div className="text-sm font-semibold dark:text-white text-gray-800 mb-4" style={{fontFamily:'Syne'}}>Mensajes por día</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{fontSize:11, fill:'#6b7280'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'#1a1a24', border:'1px solid #ffffff10', borderRadius:8, fontSize:12}} />
              <Bar dataKey="msgs" fill={chartColor} radius={[4,4,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ============ CONVERSATIONS PAGE ============
function ConversationsPage({ clientId }) {
  const [convs, setConvs] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let q = supabase.from('conversations').select('*').order('updated_at', {ascending: false}).limit(50)
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q
    setConvs(data || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(load, 15000); return () => clearInterval(t) }, [load])

  const filtered = convs.filter(c =>
    (c.user_name || c.user_phone || '').toLowerCase().includes(search.toLowerCase())
  )

  const timeAgo = (d) => {
    const diff = (new Date() - new Date(d)) / 1000
    if (diff < 60) return 'ahora'
    if (diff < 3600) return Math.floor(diff/60) + 'm'
    if (diff < 86400) return Math.floor(diff/3600) + 'h'
    return Math.floor(diff/86400) + 'd'
  }

  const colors = ['#7c5cfc','#00e5a0','#f59e0b','#ef4444','#3b82f6','#ec4899']

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 animate-fade-in">
      {/* List */}
      <div className="w-80 flex flex-col dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 overflow-hidden">
        <div className="p-4 border-b dark:border-white/5 border-gray-100">
          <h2 className="font-bold dark:text-white text-gray-900 text-sm mb-3" style={{fontFamily:'Syne'}}>Conversaciones</h2>
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg pl-8 pr-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
            <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs">
              <div className="text-3xl mb-2">💬</div>
              Sin conversaciones
            </div>
          ) : filtered.map((c, i) => {
            const name = c.user_name || c.user_phone
            const last = c.messages?.slice(-1)[0]?.content || ''
            const color = colors[i % colors.length]
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 p-3 hover:dark:bg-white/5 hover:bg-gray-50 transition text-left border-b dark:border-white/5 border-gray-50 ${selected?.id === c.id ? 'dark:bg-white/5 bg-brand-500/5 border-l-2 border-l-brand-500' : ''}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{background: color+'20', color}}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium dark:text-white text-gray-800 truncate">{name}</div>
                  <div className="text-xs dark:text-gray-600 text-gray-400 truncate">{last.substring(0,40)}</div>
                </div>
                <div className="text-[10px] dark:text-gray-600 text-gray-400 flex-shrink-0">{timeAgo(c.updated_at)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center dark:text-gray-600 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <div className="text-sm">Selecciona una conversación</div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b dark:border-white/5 border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold dark:text-white text-gray-900 text-sm" style={{fontFamily:'Syne'}}>
                  {selected.user_name || selected.user_phone}
                </div>
                <div className="text-xs dark:text-gray-500 text-gray-400">{selected.user_phone} · {selected.messages?.length || 0} mensajes</div>
              </div>
              <div className="flex items-center gap-2 text-xs dark:text-emerald-400 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Activo
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(selected.messages || []).map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'dark:bg-[#1a1a24] bg-gray-100 dark:text-white text-gray-800 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============ ORDERS PAGE ============
function OrdersPage({ clientId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let q = supabase.from('orders').select('*').order('created_at', {ascending: false})
    if (clientId) q = q.eq('client_id', clientId)
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    load()
  }

  const statusStyle = {
    pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    enviado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    entregado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelado: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight" style={{fontFamily:'Syne'}}>Pedidos</h1>
          <p className="text-sm dark:text-gray-500 text-gray-400">{orders.length} pedidos registrados</p>
        </div>
        <button onClick={load} className="text-xs dark:text-gray-500 text-gray-400 hover:text-brand-500 px-3 py-1.5 dark:bg-white/5 bg-gray-100 rounded-lg transition">↻ Actualizar</button>
      </div>

      <div className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 dark:text-gray-600 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm">Sin pedidos aún</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-gray-100">
                {['Cliente','Producto','Ciudad','Dirección','Pago','Estado','Fecha','Acción'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest dark:text-gray-600 text-gray-400 px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b dark:border-white/5 border-gray-50 hover:dark:bg-white/3 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-xs dark:text-white text-gray-800 font-medium">{o.user_name || o.user_phone}</td>
                  <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-600">{o.product || '—'}</td>
                  <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-600">{o.city || '—'}</td>
                  <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-600 max-w-[120px] truncate">{o.address || '—'}</td>
                  <td className="px-4 py-3 text-xs dark:text-gray-400 text-gray-600">{o.payment_method || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusStyle[o.status] || statusStyle.pendiente}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs dark:text-gray-500 text-gray-400">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-2 py-1 text-[10px] dark:text-white text-gray-700 cursor-pointer focus:outline-none"
                    >
                      <option>pendiente</option>
                      <option>enviado</option>
                      <option>entregado</option>
                      <option>cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============ CLIENTS PAGE ============
function ClientsPage({ clients, onRefresh }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name:'', phone_number_id:'', whatsapp_token:'', prompt:'', active: true })
  const [saving, setSaving] = useState(false)

  const saveEdit = async () => {
    setSaving(true)
    await supabase.from('clients').update({
      name: form.name, prompt: form.prompt, faq: form.faq, catalog: form.catalog,
      whatsapp_token: form.whatsapp_token, model: form.model, active: form.active
    }).eq('id', editing)
    setSaving(false)
    setEditing(null)
    onRefresh()
  }

  const saveNew = async () => {
    setSaving(true)
    await supabase.from('clients').insert(newForm)
    setSaving(false)
    setShowNew(false)
    setNewForm({ name:'', phone_number_id:'', whatsapp_token:'', prompt:'', active: true })
    onRefresh()
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight" style={{fontFamily:'Syne'}}>Clientes Bot</h1>
          <p className="text-sm dark:text-gray-500 text-gray-400">{clients.length} negocios configurados</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          + Agregar cliente
        </button>
      </div>

      {/* New client form */}
      {showNew && (
        <div className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-6">
          <h3 className="font-bold dark:text-white text-gray-900 mb-4 text-sm" style={{fontFamily:'Syne'}}>Nuevo cliente</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              {key:'name', label:'Nombre del negocio', ph:'Restaurante El Sabor'},
              {key:'phone_number_id', label:'Phone Number ID', ph:'1074951269024593'},
              {key:'whatsapp_token', label:'WhatsApp Token', ph:'EAAht...'},
              {key:'model', label:'Modelo IA', ph:'openai/gpt-3.5-turbo'},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-1.5">{f.label}</label>
                <input
                  value={newForm[f.key] || ''}
                  onChange={e => setNewForm({...newForm, [f.key]: e.target.value})}
                  placeholder={f.ph}
                  className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-1.5">Prompt del bot</label>
            <textarea
              value={newForm.prompt || ''}
              onChange={e => setNewForm({...newForm, prompt: e.target.value})}
              placeholder="Eres [nombre], asistente de [negocio]..."
              rows={4}
              className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none font-mono"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="text-xs px-4 py-2 dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 rounded-lg">Cancelar</button>
            <button onClick={saveNew} disabled={saving} className="text-xs px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </div>
      )}

      {/* Client cards */}
      <div className="space-y-3">
        {clients.map(c => (
          <div key={c.id} className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-5">
            {editing === c.id ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold dark:text-white text-gray-900 text-sm" style={{fontFamily:'Syne'}}>Editando: {c.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 rounded-lg">Cancelar</button>
                    <button onClick={saveEdit} disabled={saving} className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-60">
                      {saving ? 'Guardando...' : '💾 Guardar'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {key:'name', label:'Nombre'},
                    {key:'whatsapp_token', label:'Token WhatsApp'},
                    {key:'model', label:'Modelo IA'},
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-1">{f.label}</label>
                      <input value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                        className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50" />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id={`active-${c.id}`} checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="accent-brand-500" />
                    <label htmlFor={`active-${c.id}`} className="text-xs dark:text-gray-400 text-gray-600">Bot activo</label>
                  </div>
                </div>
                {[
                  {key:'prompt', label:'Prompt del bot', rows:5},
                  {key:'faq', label:'Preguntas frecuentes', rows:3},
                  {key:'catalog', label:'Catálogo / Menú', rows:3},
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] uppercase tracking-widest dark:text-gray-500 text-gray-400 mb-1">{f.label}</label>
                    <textarea value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      rows={f.rows}
                      className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-lg px-3 py-2 text-xs dark:text-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none font-mono" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-500 font-bold text-sm" style={{fontFamily:'Syne'}}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold dark:text-white text-gray-900 text-sm flex items-center gap-2">
                      {c.name}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {c.active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <div className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">ID: {c.phone_number_id}</div>
                    <div className="text-xs dark:text-gray-600 text-gray-400 mt-1 font-mono">Modelo: {c.model || 'gpt-3.5-turbo'}</div>
                    <div className="text-xs dark:text-gray-500 text-gray-400 mt-2 max-w-xl line-clamp-2">{c.prompt?.substring(0,120)}...</div>
                  </div>
                </div>
                <button
                  onClick={() => { setEditing(c.id); setForm({...c}) }}
                  className="text-xs dark:text-gray-500 text-gray-400 hover:text-brand-500 px-3 py-1.5 dark:bg-white/5 bg-gray-100 rounded-lg transition flex items-center gap-1.5"
                >
                  ✏️ Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ MAIN DASHBOARD ============
export default function Dashboard({ toggleTheme, dark }) {
  const router = useRouter()
  const [active, setActive] = useState('dashboard')
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('crm_auth')) {
      router.push('/')
    }
  }, [router])

  const loadClients = useCallback(async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at')
    setClients(data || [])
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const handleLogout = () => {
    localStorage.removeItem('crm_auth')
    router.push('/')
  }

  const pages = {
    dashboard: <DashboardPage clientId={selectedClient} clients={clients} />,
    conversations: <ConversationsPage clientId={selectedClient} />,
    orders: <OrdersPage clientId={selectedClient} />,
    clients: <ClientsPage clients={clients} onRefresh={loadClients} />,
  }

  return (
    <div className="dark:bg-[#0a0a0f] bg-gray-50 min-h-screen">
      <Sidebar
        active={active}
        setActive={setActive}
        clients={clients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        toggleTheme={toggleTheme}
        dark={dark}
        onLogout={handleLogout}
      />
      <main className="ml-56 p-6">
        {pages[active]}
      </main>
    </div>
  )
}
