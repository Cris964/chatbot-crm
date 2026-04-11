import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, UserCircle, Kanban,
  DollarSign, Truck, Zap, BarChart3, Settings, Search,
  Bell, Menu, ChevronLeft, Sparkles, LogOut, HelpCircle, User,
  X, Clock, MessageCircle, Shield, ChevronRight, Command, Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from './NexusLogo'

const navItems = [
  { label: 'GENERAL', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/calendario', icon: Calendar, label: 'Calendario' },
  ]},
  { label: 'NEGOCIO', items: [
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/ventas', icon: DollarSign, label: 'Ventas' },
    { to: '/marketing', icon: Zap, label: 'Marketing' },
    { to: '/despachos', icon: Truck, label: 'Logística' },
  ]},
  { label: 'SISTEMA', items: [
    { to: '/configuracion', icon: Settings, label: 'Ajustes' },
  ]},
]

export default function Layout({ session }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const profileRef = useRef(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const [showNotifications, setShowNotifications] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="nexus-logo-wrapper">
             <NexusLogo size={collapsed ? 36 : 40} />
             {!collapsed && (
               <div className="logo-text">
                 <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>NexusCRM</h1>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em' }}>PRECISION SAAS</span>
               </div>
             )}
          </div>
        </div>

        <nav className="sidebar-nav" style={{ marginTop: 12 }}>
          {navItems.map((section) => (
            <div key={section.label}>
              {!collapsed && <div className="nav-section-label" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', paddingLeft: 24, marginBottom: 8 }}>{section.label}</div>}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {item.badge && !collapsed && <span className="nav-badge" style={{ background: '#6366f1', color: 'white', fontSize: 10, padding: '2px 6px' }}>{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--glass-border)', padding: 16 }}>
          <div className="sidebar-user" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ background: showProfileMenu ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: 12, padding: 8 }}>
            <div className="avatar md" style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', fontSize: 12 }}>
              {session?.user?.email?.substring(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="user-info">
                <div className="user-name" style={{ fontSize: '0.85rem' }}>{session?.user?.email?.split('@')[0]}</div>
                <div className="user-role" style={{ fontSize: '0.7rem' }}>Administrador</div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: 16, right: 16,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: '8px', zIndex: 50,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              animation: 'scaleIn 0.2s ease-out'
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-default)', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{session?.user?.email}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Plan Enterprise</div>
              </div>
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
              >
                <UserCircle size={16} /> Ver Perfil
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
              >
                <Settings size={16} /> Ajustes
              </button>
              <div style={{ height: 1, background: 'var(--border-default)', margin: '8px 0' }} />
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-rose)' }}
                onClick={handleLogout}
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="top-header">
          <button className="header-toggle" onClick={() => setCollapsed(!collapsed)}>
            <Menu size={20} />
          </button>

          <div className="header-search">
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Search for deals, tasks or clients... (⌘K)" />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-tertiary)' }}>⌘</div>
               <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-tertiary)' }}>K</div>
            </div>
          </div>

          <div className="header-actions">
            <button className="header-action-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <button className="header-action-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)' }} onClick={() => setShowAIModal(true)}>
              <Sparkles size={20} />
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />
            <button className="header-action-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="card animate-slideUp" style={{ position: 'absolute', top: 70, right: 120, width: 320, zIndex: 1000, padding: 0 }}>
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Notificaciones</h3>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px' }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', borderRadius: 12 }} className="table-row-hover">
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nuevo Lead: WhatsApp</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Hace 5 minutos</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>Ver todas</button>
                </div>
              </div>
            )}

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

        <Outlet context={{ session }} />
      </div>
    </div>
  )
}
