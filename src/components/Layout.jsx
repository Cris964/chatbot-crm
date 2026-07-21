import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, UserCircle, Kanban,
  DollarSign, Truck, Zap, Settings, Search,
  Bell, Menu, Sparkles, LogOut, Calendar,
  Package, ShieldCheck, Megaphone, AlertCircle, CreditCard, Sun, Moon, ListTodo
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import NexusLogo from './NexusLogo'

const SUPER_ADMIN_EMAILS = ['admin@chekadmin.com', 'naturel@admin.com']

export default function Layout({ session }) {
  const tenant = useTenant()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (tenant.clientId) {
      fetchNotifications()
      
      const channel = supabase
        .channel('realtime:notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `client_id=eq.${tenant.clientId}` 
        }, payload => {
          setNotifications(prev => [payload.new, ...prev])
          
          // 1. Reproducir sonido (Beep) usando Web Audio API
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            osc.start()
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
            osc.stop(ctx.currentTime + 0.5)
          } catch(err){ console.log("Audio no soportado o bloqueado", err) }

          // 2. Notificación Push del Navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('NexusCRM Alerta', {
                body: payload.new.type === 'escalation' ? '¡Un cliente necesita asistencia humana urgente!' : 'Tienes una nueva notificación en el sistema.',
                icon: '/vite.svg'
              })
            } catch(e) { console.log("Push no soportado", e) }
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [tenant.clientId])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*, conversations(user_name)')
      .eq('client_id', tenant.clientId)
      .eq('read', false)
      .order('created_at', { ascending: false })
    
    if (data) setNotifications(data)
  }

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'GENERAL', items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
      { to: '/productos', icon: Package, label: 'Productos' },
      { to: '/remarketing', icon: Megaphone, label: 'Re-marketing' },
      ...(tenant.clientName === 'Activo Morrales' ? [{ to: '/lists', icon: ListTodo, label: 'Listas' }] : []),
      { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    ]},
    { label: 'OPERACIONES', items: [
      { to: '/leads', icon: Users, label: 'Leads' },
      { to: '/ventas', icon: CreditCard, label: 'Ventas' },
      { to: '/despachos', icon: Truck, label: 'Logística' },
      { to: '/calendario', icon: Calendar, label: 'Calendario' },
    ]},
    { label: 'SISTEMA', items: [
      ...(tenant.isAdmin ? [{ to: '/usuarios', icon: Users, label: 'Usuarios' }] : []),
      { to: '/configuracion', icon: Settings, label: 'Ajustes' },
      ...(tenant.isSuperAdmin ? [{ to: '/super-admin', icon: ShieldCheck, label: 'Super Admin' }] : []),
    ]},
  ]

  const roleLabels = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    soporte: 'Soporte',
    marketing: 'Marketing',
  }

  const displayRole = roleLabels[tenant.role] || tenant.role || 'Usuario'

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} 
        onClick={() => setMobileOpen(false)}
      ></div>

      <aside className={`sidebar ${isSidebarCollapsed && !mobileOpen ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="nexus-logo-wrapper">
             <NexusLogo size={isSidebarCollapsed ? 36 : 40} />
             {!isSidebarCollapsed && (
               <div className="logo-text">
                 <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>NexusCRM</h1>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                   {tenant.clientName || 'Cargando...'}
                 </span>
               </div>
             )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.label}>
              {!isSidebarCollapsed && <div className="nav-section-label" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', paddingLeft: 24, marginBottom: 8 }}>{section.label}</div>}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 12px' }}>
          <NavLink to="/settings" className="sidebar-user" style={{ 
            display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit',
            background: 'rgba(var(--overlay-rgb), 0.02)', borderRadius: 16, padding: '10px 12px',
            border: '1px solid rgba(var(--overlay-rgb), 0.05)', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--overlay-rgb), 0.08)'; e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb), 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(var(--overlay-rgb), 0.02)'; e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb), 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
          >
            <div className="avatar md" style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', fontSize: 12, boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)', flexShrink: 0 }}>
              {tenant.membership?.full_name?.substring(0, 2).toUpperCase() || session?.user?.email?.substring(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {tenant.membership?.full_name || session?.user?.email?.split('@')[0]}
                </div>
                <div className="user-role" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{displayRole}</div>
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <button className="header-toggle" onClick={() => {
            if (window.innerWidth <= 768) {
              setMobileOpen(!mobileOpen)
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed)
            }
          }}>
            <Menu size={20} />
          </button>

          <div className="header-search" style={{ display: 'none' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Search for deals, tasks or clients... (⌘K)" />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
               <div style={{ background: 'rgba(var(--overlay-rgb), 0.05)', border: '1px solid var(--glass-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-tertiary)' }}>⌘</div>
               <div style={{ background: 'rgba(var(--overlay-rgb), 0.05)', border: '1px solid var(--glass-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-tertiary)' }}>K</div>
            </div>
          </div>

          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="header-action-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {notifications.length > 0 && <span className="notification-dot"></span>}
              </button>

              {showNotifications && (
                <div className="card" style={{ 
                  position: 'absolute', top: '100%', right: 0, width: 320, 
                  zIndex: 1000, marginTop: 12, padding: 0, overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notificaciones</h4>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        No hay alertas pendientes
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ 
                          padding: '12px 16px', borderBottom: '1px solid var(--border-default)',
                          background: n.type === 'escalation' ? 'rgba(244, 63, 94, 0.05)' : 'transparent'
                        }}>
                          <div className="flex items-start gap-3">
                            <AlertCircle size={16} style={{ color: 'var(--accent-rose)', marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Asistencia Humana</div>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                                <strong>{n.conversations?.user_name || 'Cliente'}</strong> necesita ayuda con un asesor.
                              </p>
                              <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                  {new Date(n.created_at).toLocaleTimeString()}
                                </span>
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                                  onClick={() => {
                                    markAsRead(n.id)
                                    window.location.href = `/inbox?id=${n.conversation_id}`
                                  }}
                                >
                                  Ver Chat
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="header-action-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="header-action-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)' }} onClick={() => setShowAIModal(true)}>
              <Sparkles size={20} />
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />
            <button className="header-action-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>



            {/* AI Assistant Modal */}
            {showAIModal && (
              <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAIModal(false)}>
                <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 500, padding: 0 }} onClick={e => e.stopPropagation()}>
                    <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)', padding: '24px' }}>
                       <div className="flex items-center gap-3">
                          <div className="ai-icon-wrapper large"><Sparkles /></div>
                          <div>
                             <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Nexus AI Assistant</h2>
                             <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Inteligencia Artificial para tu negocio</p>
                          </div>
                          <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setShowAIModal(false)}><X /></button>
                       </div>
                    </div>
                    <div style={{ padding: '24px' }}>
                       <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Hola, soy Nexus AI. Puedo ayudarte a generar respuestas automáticas, calificar tus leads y programar campañas de re-marketing.</p>
                       <div className="flex gap-2 mt-6">
                          <button className="btn btn-primary" style={{ flex: 1 }}>Analizar Leads</button>
                          <button className="btn btn-secondary" style={{ flex: 1 }}>Ayuda</button>
                       </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <Outlet context={{ session, tenant }} />
      </div>
    </div>
  )
}
