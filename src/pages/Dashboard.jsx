import React, { useState, useEffect, Component } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ChevronRight, Activity, Zap, Search, Layers
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell
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

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Dashboard Render Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#ffebee', color: '#b71c1c', borderRadius: '8px', margin: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard Crashed!</h2>
          <p style={{ marginTop: '10px' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ marginTop: '20px', overflowX: 'auto', fontSize: '12px', background: '#ffcdd2', padding: '10px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent() {
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
  const [agentMetrics, setAgentMetrics] = useState([])

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

      // 3. Fetch Team Members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('client_id', tenant.clientId)

      // 4. Fetch Conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', tenant.clientId)

      let totalRevenue = 0;
      let totalSalesCount = 0;
      let aiChatsCount = 0;
      let answeredChatsCount = 0;
      let pendingChatsCount = 0;

      if (convs) {
        answeredChatsCount = convs.filter(c => {
           const unread = c.messages && c.messages.length > 0 && (c.messages[c.messages.length - 1].role === 'user' || c.messages[c.messages.length - 1].role === 'customer');
           return !unread;
        }).length;
        
        aiChatsCount = convs.filter(c => c.needs_human === false || c.needs_human == null).length;
        
        pendingChatsCount = convs.filter(c => {
           const unread = c.messages && c.messages.length > 0 && (c.messages[c.messages.length - 1].role === 'user' || c.messages[c.messages.length - 1].role === 'customer');
           return unread && !c.archived;
        }).length;
      }

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const grouped = months.map(m => ({ name: m, value: 0, value2: 0 }))
      
      if (orders && orders.length > 0) {
        totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
        totalSalesCount = orders.length;
        
        orders.forEach(o => {
          const date = new Date(o.created_at)
          const monthIdx = date.getMonth()
          if (date.getFullYear() === 2026) {
            grouped[monthIdx].value += (Number(o.amount) || 0)
            grouped[monthIdx].value2 = grouped[monthIdx].value * 0.7 
          }
        })
      }

      if (leads) {
        const active = leads.filter(l => !['Gano', 'Perdio'].includes(l.stage)).length
        const wonLeads = leads.filter(l => l.stage === 'Gano')
        const won = wonLeads.length
        const convRate = convs && convs.length > 0 ? `${((aiChatsCount / convs.length) * 100).toFixed(0)}%` : '0%'

        const parseVal = (v) => {
           if(!v) return 0;
           if (typeof v === 'number') return v;
           return Number(String(v).replace(/[^0-9.-]+/g, "")) || 0;
        };

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

        const recent = leads.slice(0, 4).map(l => ({
          lead: l.name,
          stage: l.stage || 'Nuevo',
          value: l.value ? (String(l.value).includes('$') ? l.value : `$${(parseVal(l.value)/1000).toFixed(1)}k`) : (l.amount ? `$${(l.amount/1000).toFixed(1)}k` : `$0.0k`),
          date: new Date(l.created_at).toLocaleDateString(),
          color: l.stage === 'Gano' ? '#10b981' : (l.stage === 'Perdio' ? '#f43f5e' : '#6366f1')
        }))
        
        const stages = ['Nuevo', 'Contactado', 'Propuesta', 'Negociación']
        const pData = stages.map(s => ({
          name: s,
          value: leads.filter(l => l.stage === s).length,
          color: s === 'Nuevo' ? '#6366f1' : (s === 'Contactado' ? '#8b5cf6' : (s === 'Propuesta' ? '#f59e0b' : '#10b981'))
        }))

        setStats(prev => ({ 
          ...prev, 
          revenue: totalRevenue,
          salesCount: totalSalesCount,
          dealsActive: active,
          newLeads: leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
          conversion: convRate,
          aiChats: aiChatsCount,
          answeredChats: answeredChatsCount,
          pendingChats: pendingChatsCount
        }))
        setRecentDealsList(recent)
        setPipelineState(pData)

        if (teamMembers && teamMembers.length > 0) {
           const metrics = teamMembers.map(member => {
              const mLeads = leads.filter(l => l.assigned_to === member.user_id || l.assigned_to === member.id || l.assigned_to === member.full_name)
              const won = mLeads.filter(l => l.stage === 'Gano')
              
              let chatsHandled = 0;
              if (convs) {
        answeredChatsCount = convs.filter(c => !c.unread).length;
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
           }).sort((a, b) => b.revenue - a.revenue)
           setAgentMetrics(metrics)
        }
      }

    } catch (err) {
      console.error("Dashboard error:", err)
    }
    setIsLoading(false)
  }

  return (
    <div className="page-content" style={{ padding: '32px', position: 'relative' }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-primary)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Cargando métricas...</p>
        </div>
      )}

      {/* Title Area */}
      <div className="flex justify-between items-end mb-6 animate-slideUp">
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            ¡Buenos días, {tenant.membership?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Usuario'}!
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '6px 12px' }}><span className="text-xs font-semibold">Filtrar</span></button>
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '6px 12px' }}><span className="text-xs font-semibold">Mensual</span></button>
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '6px 12px' }}><span className="text-xs font-semibold">Descargar Datos</span></button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <button style={{ background: '#4318FF', color: 'white', borderRadius: '24px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(67, 24, 255, 0.3)' }}>
            <span>+ Nuevo Lead</span>
          </button>
          <div className="flex gap-2">
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px' }}><Search size={14} /></button>
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px' }}><span className="text-xs font-semibold">Soporte</span></button>
             <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', borderRadius: '8px' }}><Layers size={14} /></button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }} className="animate-slideUp">
        
        {/* Card 1: Rendimiento de Respuestas */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.1s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)' }}>
           <div className="flex justify-between mb-4">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tiempo de Respuesta</h3>
              <select style={{ background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-tertiary)', padding: '2px 4px' }}><option>Hoy</option><option>Semana</option><option>Mes</option></select>
              <span style={{ fontSize: '0.7rem', color: '#4318FF', fontWeight: 600 }}>Reporte</span>
           </div>
           <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                 <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stats?.answeredChats || 0}</span>
                 <div style={{ width: 12, height: 4, borderRadius: 2, background: '#10b981' }}></div>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Chats Contestados</span>
              </div>
           </div>
           <div style={{ height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <Area type="monotone" dataKey="value2" stroke="#10b981" fill="transparent" strokeWidth={2} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-between" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
             <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span>
           </div>
        </div>

        {/* Card 2: Chats Pendientes (Blue Card) */}
        <div style={{ background: '#4318FF', borderRadius: '20px', padding: '24px', color: 'white', boxShadow: '0 4px 20px rgba(67,24,255,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div className="flex justify-between items-start">
             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4318FF' }}></div>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>Urgente</div>
           </div>
           <div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '16px 0 4px 0', letterSpacing: '-0.02em' }}>Chats Pendientes</h3>
             <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{stats?.pendingChats || 0}</div>
             <p style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4, marginTop: 8 }}>
               Conversaciones que requieren atención humana inmediata.
             </p>
           </div>
           <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
             <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}></div>
             <div style={{ width: 12, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}></div>
             <div style={{ width: 12, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}></div>
           </div>
        </div>

        {/* Card 3: % Conversaciones Efectivas */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.2s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)' }}>
           <div className="flex justify-between mb-4">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Efectividad de Chats</h3>
           </div>
           <div className="flex items-end gap-2 mb-2">
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.conversion || '0%'}</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, paddingBottom: 6, background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 10 }}>+5.4%</div>
           </div>
           <div style={{ height: 110, marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4318FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="pv" stroke="#4318FF" fill="url(#colorPv)" strokeWidth={2} dot={false} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-between" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
             <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span>
           </div>
        </div>

        {/* Card 4: Difusiones Efectivas */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.30000000000000004s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)' }}>
           <div className="flex justify-between mb-4">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Difusiones Efectivas</h3>
           </div>
           <div className="flex flex-col gap-6 mt-4">
              
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <span style={{ fontSize: 10, fontWeight: 'bold' }}>Hoy</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>124 envíos</div>
                    </div>
                 </div>
                 <div style={{ width: '100%', height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '25%', height: '100%', background: '#10b981' }}></div>
                 </div>
              </div>

              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(67, 24, 255, 0.1)', color: '#4318FF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(67, 24, 255, 0.2)' }}>
                      <span style={{ fontSize: 10, fontWeight: 'bold' }}>Sem</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>850 envíos</div>
                    </div>
                 </div>
                 <div style={{ width: '100%', height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '65%', height: '100%', background: '#4318FF' }}></div>
                 </div>
              </div>

              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <span style={{ fontSize: 10, fontWeight: 'bold' }}>Mes</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>3,240 envíos</div>
                    </div>
                 </div>
                 <div style={{ width: '100%', height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: '#f59e0b' }}></div>
                 </div>
              </div>

           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="animate-slideUp">
        
        {/* Row 2 Card 1: Info */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.4s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)', gridColumn: 'span 1' }}>
           <div className="flex justify-between items-center mb-6">
             <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Información de la Cuenta</h3>
             <span style={{ fontSize: '0.7rem', color: '#4318FF', fontWeight: 600 }}>Ver Detalle</span>
           </div>
           <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                 <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4318FF, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {tenant.clientName?.substring(0,2).toUpperCase()}
                 </div>
              </div>
              <div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tenant.clientName}</div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Plan Corporativo</div>
              </div>
           </div>
           
           <div style={{ height: 1, background: 'var(--border-default)', margin: '16px 0' }}></div>
           
           <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Total Leads</div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.newLeads} leads</div>
              </div>
              <div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Chats IA</div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.aiChats} chats</div>
              </div>
              <div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Ventas Activas</div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.salesCount} órdenes</div>
              </div>
              <div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Asignado A</div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Múltiples Asesores</div>
              </div>
           </div>
        </div>

        {/* Row 2 Card 2: Bar Chart */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.5s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)', gridColumn: 'span 2' }}>
           <div className="flex justify-between items-center mb-6">
             <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reporte del Pipeline</h3>
             <span style={{ fontSize: '0.7rem', color: '#4318FF', fontWeight: 600 }}>Ver Detalles</span>
           </div>
           <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', top: 40, left: 100, background: '#1e293b', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
               <span style={{ fontWeight: 600 }}>{pipelineState[0]?.name || 'Nuevo'}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4318FF' }}></div> {pipelineState[0]?.value || 0} leads</span>
             </div>
             <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={pipelineState} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={36}>
                        {pipelineState.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#blueGradient)" />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4318FF" />
                          <stop offset="100%" stopColor="rgba(67,24,255,0.2)" />
                        </linearGradient>
                      </defs>
                   </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* Row 2 Card 3: Agents */}
        <div className="animate-slideUp" style={{ animationFillMode: 'both', animationDelay: '0.6000000000000001s', background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-default)', gridColumn: 'span 1' }}>
           <div className="flex justify-between items-center mb-6">
             <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Mis Asesores</h3>
             <span style={{ fontSize: '0.7rem', color: '#4318FF', fontWeight: 600 }}>Ver Detalle</span>
           </div>
           <div className="flex flex-col gap-5">
              {agentMetrics.slice(0, 3).map((agent, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                       <img src={`https://ui-avatars.com/api/?name=${agent.name}&background=random`} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                       <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
                       <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{agent.won} Ganados | ${agent.revenue}</div>
                    </div>
                 </div>
              ))}
              {agentMetrics.length === 0 && (
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No hay asesores con datos.</div>
              )}
           </div>
        </div>
      </div>

    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  )
}

function ChevronDown(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}
