import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, UserCircle, Kanban,
  DollarSign, Truck, Zap, BarChart3, Settings, Search,
  Bell, Menu, ChevronLeft, Sparkles, LogOut, HelpCircle
} from 'lucide-react'

const navItems = [
  { label: 'PRINCIPAL', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inbox', icon: MessageSquare, label: 'Inbox', badge: 12 },
  ]},
  { label: 'GESTIÓN', items: [
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/clients', icon: UserCircle, label: 'Clientes' },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/sales', icon: DollarSign, label: 'Ventas' },
    { to: '/dispatches', icon: Truck, label: 'Despachos' },
  ]},
  { label: 'SISTEMA', items: [
    { to: '/automations', icon: Zap, label: 'Automatizaciones' },
    { to: '/reports', icon: BarChart3, label: 'Reportes' },
    { to: '/settings', icon: Settings, label: 'Configuración' },
  ]},
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
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

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              CA
            </div>
            <div className="user-info">
              <div className="user-name">Carlos Arango</div>
              <div className="user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="top-header">
          <button className="header-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>

          <div className="header-search">
            <Search />
            <input type="text" placeholder="Buscar leads, clientes, conversaciones... (⌘K)" />
          </div>

          <div className="header-actions">
            <button className="header-action-btn" title="Ayuda">
              <HelpCircle size={20} />
            </button>
            <button className="header-action-btn" title="Notificaciones">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <button className="header-action-btn" title="IA Assistant">
              <Sparkles size={20} />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
