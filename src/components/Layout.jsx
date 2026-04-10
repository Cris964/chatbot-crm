import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, UserCircle, Kanban,
  DollarSign, Truck, Zap, BarChart3, Settings, Search,
  Bell, Menu, ChevronLeft, Sparkles, LogOut, HelpCircle, User,
  X, Clock, MessageCircle, Shield, ChevronRight, Command
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from './NexusLogo'

const navItems = [
  { label: 'GENERAL', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inbox', icon: MessageSquare, label: 'Inbox' },
  ]},
  { label: 'NEGOCIO', items: [
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/ventas', icon: DollarSign, label: 'Ventas' },
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
            <button className="header-action-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <button className="header-action-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)' }}>
              <Sparkles size={20} />
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />
            <button className="header-action-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <Outlet context={{ session }} />
      </div>
    </div>
  )
}
