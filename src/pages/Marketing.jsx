import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Zap, Users, BarChart3, MessageSquare, 
  Send, Calendar, Target, Sparkles,
  ChevronRight, ArrowUpRight, Filter, Plus, 
  CheckCircle2, Clock, Mail
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Marketing() {
  const { session } = useOutletContext()
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) fetchClients()
  }, [session])

  const fetchClients = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
    
    setClients(data || [])
    setIsLoading(false)
  }

  // Mock campaigns
  const campaigns = [
    { id: 1, name: 'Re-engagement Clientes Dormidos', status: 'Running', reach: 250, conversion: '12%', channel: 'WhatsApp' },
    { id: 2, name: 'Promo Lanzamiento Naturel Pro', status: 'Draft', reach:  480, conversion: '-', channel: 'Multi-channel' },
  ]

  return (
    <div className="page-content" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <div className="page-header animate-slideUp">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Marketing & Re-marketing</h1>
            <p className="page-subtitle">Activa tu base de datos con campañas inteligentes</p>
          </div>
          <button className="btn btn-primary"><Plus size={18} /> Nueva Campaña</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 40 }} className="animate-slideUp stagger-1">
         <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between mb-4">
               <div className="avatar md" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)' }}><Users size={20} /></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>+12% vs mes anterior</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{clients.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Clientes en Base de Datos</div>
         </div>
         <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between mb-4">
               <div className="avatar md" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}><Zap size={20} /></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)' }}>85% Automatizado</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>1,240</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Mensajes Enviados (Bot)</div>
         </div>
         <div className="card" style={{ padding: 24 }}>
            <div className="flex justify-between mb-4">
               <div className="avatar md" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}><Target size={20} /></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>Meta: 15%</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>9.4%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 4 }}>Tasa de Conversión Promedio</div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 24 }}>
         
         {/* Campaigns List */}
         <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: 24, borderBottom: '1px solid var(--glass-border)' }}>
               <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Campañas Activas</h3>
            </div>
            <div style={{ padding: 12 }}>
               {campaigns.map(c => (
                 <div key={c.id} style={{ padding: '20px', borderRadius: 16, borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="table-row-hover">
                    <div className="flex items-center gap-4">
                       <div className="avatar md" style={{ background: c.status === 'Running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: c.status === 'Running' ? 'var(--accent-emerald)' : 'var(--text-tertiary)' }}>
                          <Send size={18} />
                       </div>
                       <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                          <div className="flex gap-3 mt-1">
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Alcance: <strong>{c.reach}</strong></span>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Canal: <strong>{c.channel}</strong></span>
                          </div>
                       </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>{c.conversion}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Conversión</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* AI Segments */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))', border: '1px solid var(--primary-600)' }}>
               <div className="flex items-center gap-2 mb-4">
                  <div className="ai-icon-wrapper mini"><Sparkles size={14} /></div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Sugerencia Re-marketing</h3>
               </div>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Hemos detectado que <strong>43 clientes High-Value</strong> no han realizado pedidos en los últimos 30 días.
               </p>
               <button className="btn btn-primary btn-sm mt-6" style={{ width: '100%' }}>Lanzar Campaña VIP</button>
            </div>

            <div className="card" style={{ padding: 24 }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20 }}>Segmentos de Clientes</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Top Spenders', count: 12, color: 'var(--accent-emerald)' },
                    { label: 'Inactivos (30d)', count: 85, color: 'var(--accent-rose)' },
                    { label: 'Nuevos (Esta semana)', count: 24, color: 'var(--accent-cyan)' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                       <div className="flex items-center gap-3">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.label}</span>
                       </div>
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>{s.count}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

      </div>
    </div>
  )
}
