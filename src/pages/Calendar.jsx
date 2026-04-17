import { useState } from 'react'
import { 
  Calendar as CalendarIcon, Clock, Users, Plus, 
  ChevronLeft, ChevronRight, MoreHorizontal, 
  CheckCircle2, AlertCircle, Sparkles, MapPin, Search, X
} from 'lucide-react'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('Month')
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newAppt, setNewAppt] = useState({ title: '', date: '', time: '', contact: '' })

  // Mock appointments
  const appointments = [
    { id: 1, title: 'Reunión NexusCRM', time: '10:00 AM', date: '2026-04-12', type: 'Demo', status: 'Confirmed', contact: 'Juan Pérez' },
    { id: 2, title: 'Cierre de Venta - Bot Auto', time: '02:30 PM', date: '2026-04-12', type: 'Sales', status: 'Pending', contact: 'Maria Lopez' },
  ]

  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div className="page-content" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <div className="page-header animate-slideUp">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Agenda Inteligente</h1>
            <p className="page-subtitle">Gestión de citas automatizada por Nexus AI</p>
          </div>
          <div className="flex gap-3">
             <div className="flex p-1 bg-elevated rounded-xl border border-glass">
                {['Month', 'Week', 'Day'].map(v => (
                  <button 
                    key={v} 
                    onClick={() => setView(v)}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: 10, 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        background: view === v ? 'var(--primary-600)' : 'transparent',
                        color: view === v ? 'white' : 'var(--text-tertiary)',
                        transition: 'all 0.2s'
                    }}
                  >
                    {v}
                  </button>
                ))}
             </div>
             <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Nueva Cita</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, height: 'calc(100vh - 250px)' }}>
        
        {/* Calendar Grid */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="flex gap-2">
               <button className="btn btn-secondary p-2"><ChevronLeft size={20} /></button>
               <button className="btn btn-secondary p-2"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {days.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '12px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d}</div>
            ))}
            
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 2 // Simple offset for demo
              const isToday = dayNum === 11
              const hasAppt = dayNum === 12
              
              return (
                <div key={i} style={{ 
                    border: '1px solid rgba(255,255,255,0.03)', 
                    minHeight: 100, 
                    padding: 12,
                    background: isToday ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                    position: 'relative'
                }}>
                   {dayNum > 0 && dayNum <= 30 && (
                     <>
                        <span style={{ fontSize: '0.9rem', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--primary-400)' : 'var(--text-secondary)' }}>{dayNum}</span>
                        {hasAppt && (
                          <div style={{ marginTop: 8, padding: '4px 8px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary-600)', borderRadius: 6 }}>
                             <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Demo CRM</div>
                             <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>10:00 AM</div>
                          </div>
                        )}
                     </>
                   )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center gap-2 mb-6">
                 <div className="ai-icon-wrapper mini"><Sparkles size={14} /></div>
                 <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Sugerencia de la IA</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                 "Tienes 3 clientes que han solicitado una llamada técnica hoy. ¿Deseas que el bot les proponga horarios?"
              </p>
              <button 
                className="btn btn-primary btn-sm mt-4" 
                onClick={() => alert('Nexus AI está contactando a los clientes para agendar...')}
                style={{ width: '100%', background: 'var(--accent-emerald)' }}
               >
                Automatizar Agendamiento
               </button>
           </div>

           <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>Próximas Citas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {appointments.map(a => (
                   <div key={a.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                      <div className="flex justify-between items-start mb-2">
                         <span className={`badge ${a.status === 'Confirmed' ? 'emerald' : 'amber'}`} style={{ fontSize: '0.6rem' }}>{a.status}</span>
                         <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{a.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                         <Clock size={12} /> {a.time}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                         <Users size={12} /> {a.contact}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Nueva Cita</h1>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Título de la Cita</label>
                  <input type="text" className="input" placeholder="ej: Revisión Técnica" value={newAppt.title} onChange={e => setNewAppt({...newAppt, title: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Fecha</label>
                        <input type="date" className="input" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Hora</label>
                        <input type="time" className="input" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                    </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Cliente / Contacto</label>
                  <input type="text" className="input" placeholder="Buscar contacto..." value={newAppt.contact} onChange={e => setNewAppt({...newAppt, contact: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, margin: '0 -24px -8px', paddingRight: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button 
                    className="btn btn-primary" 
                    onClick={() => {
                        alert('Cita agendada correctamente (Simulación)');
                        setShowModal(false);
                    }}
                >
                    Agendar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
