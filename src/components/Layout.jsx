import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, UserCircle, Kanban,
  DollarSign, Truck, Zap, BarChart3, Settings, Search,
  Bell, Menu, ChevronLeft, Sparkles, LogOut, HelpCircle, User
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navItems = [
  { label: 'PRINCIPAL', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
  ]},
  { label: 'GESTIÓN', items: [
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/clientes', icon: UserCircle, label: 'Clientes' },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/ventas', icon: DollarSign, label: 'Ventas' },
    { to: '/despachos', icon: Truck, label: 'Despachos' },
  ]},
  { label: 'SISTEMA', items: [
    { to: '/automatizaciones', icon: Zap, label: 'Automatizaciones' },
    { to: '/reportes', icon: BarChart3, label: 'Reportes' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
  ]},
]

export default function Layout({ session }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false)
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (Mobile Only) */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles />
          </div>
          <div className="sidebar-brand">
            <h1>NexusCRM</h1>
            <span>Plataforma SaaS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive && (item.to === '/' ? location.pathname === '/' : true) ? 'active' : ''}`
                  }
                  end={item.to === '/'}
                >
                  <item.icon />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" ref={profileRef} style={{ position: 'relative' }}>
          <div 
            className="sidebar-user" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ cursor: 'pointer', padding: '12px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', background: showProfileMenu ? 'var(--bg-active)' : 'transparent' }}
          >
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              {session?.user?.email?.substring(0, 2)?.toUpperCase() || 'CA'}
            </div>
            <div className="user-info">
              <div className="user-name">{session?.user?.email?.split('@')[0] || 'Usuario'}</div>
              <div className="user-role">Administrador</div>
            </div>
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
                onClick={() => { setShowProfileMenu(false); navigate('/configuracion'); }}
              >
                <User size={16} /> Ver Perfil
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
                onClick={() => { setShowProfileMenu(false); navigate('/configuracion'); }}
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
          <button className="header-toggle desktop-only" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button className="header-toggle mobile-only" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="header-search">
            <Search />
            <input type="text" placeholder="Buscar leads, clientes, conversaciones... (⌘K)" />
          </div>

          <div className="header-actions">
            <button className="header-action-btn" title="Ayuda">
              <HelpCircle size={20} />
            </button>
            
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className={`header-action-btn ${showNotifMenu ? 'active' : ''}`} 
                title="Notificaciones"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={showNotifMenu ? { background: 'var(--bg-active)' } : {}}
              >
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>

              {/* Notif Dropdown */}
              {showNotifMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 320,
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', padding: '16px', zIndex: 50,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                  animation: 'scaleIn 0.2s ease-out'
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notificaciones</h3>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>Marcar todas leídas</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, padding: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-active)' }}>
                      <div className="avatar sm" style={{ background: '#25d366' }}><MessageSquare size={14} color="white"/></div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Nuevo mensaje de María González</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>WhatsApp • Hace 2 min</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, padding: 8, borderRadius: 'var(--radius-md)' }}>
                      <div className="avatar sm" style={{ background: '#f59e0b' }}><Zap size={14} color="white"/></div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Lead escalado a Humano</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Bot IA • Hace 15 min</div>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: '0.8rem', justifyContent: 'center' }}>
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>

            <button className="header-action-btn" title="IA Assistant">
              <Sparkles size={20} />
            </button>
          </div>
        </header>

        <Outlet context={{ session }} />
      </div>
    </div>
  )
}
