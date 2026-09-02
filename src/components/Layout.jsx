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
      ...(tenant.clientId === 'c91119cc-5451-4a64-b0e8-6b53d33d5563' ? [{ to: '/lists', icon: ListTodo, label: 'Listas' }] : []),
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
      ...(tenant.isAdmin ? [{ to: '/pagos', icon: DollarSign, label: 'Pagos' }] : []),
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
    <div className="app-layout" style={{ flexDirection: 'column' }}>
      <style>{`
        .app-layout { display: flex; flex-direction: column !important; height: 100vh; overflow: hidden; background-color: var(--bg-primary); }
        .top-navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 85px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-default); flex-shrink: 0; z-index: 100; }
        .top-nav-links { display: flex; gap: 12px; align-items: center; overflow-x: auto; flex: 1; margin: 0 40px; padding: 8px 0; }
        .top-nav-links::-webkit-scrollbar { display: none; }
        .top-nav-item { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 30px; color: var(--text-secondary); text-decoration: none; font-weight: 600; font-size: 0.95rem; transition: all 0.2s ease-in-out; white-space: nowrap; border: 1px solid transparent; }
        .top-nav-item:hover { background: rgba(var(--overlay-rgb), 0.05); color: var(--text-primary); }
        .top-nav-item.active { background: var(--primary-500); color: #ffffff; box-shadow: 0 4px 20px 0 rgba(67, 24, 255, 0.4); }
        .sidebar { display: none !important; }
        .top-header { display: none !important; }
        .main-content { flex: 1; overflow-y: auto; padding: 32px; background: var(--bg-primary); }
        .header-actions { display: flex; align-items: center; gap: 16px; }
        .header-action-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--glass-border); background: transparent; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .header-action-btn:hover { background: rgba(var(--overlay-rgb), 0.05); color: var(--text-primary); }
        .profile-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #10b981); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3); }
      `}</style>

      <header className="top-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NexusLogo size={36} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Nexus<span style={{color: 'var(--primary-500)'}}>CRM</span></h1>
        </div>

        <nav className="top-nav-links">
          {navItems.flatMap(s => s.items).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `top-nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button className="header-action-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {notifications.length > 0 && <span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, background: 'var(--accent-rose)', borderRadius: '50%' }}></span>}
          </button>

          {showNotifications && (
            <div className="card" style={{ position: 'absolute', top: 75, right: 24, width: 320, zIndex: 1000, padding: 0, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notificaciones</h4>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No hay alertas pendientes</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', background: n.type === 'escalation' ? 'rgba(244, 63, 94, 0.05)' : 'transparent' }}>
                      <div className="flex items-start gap-3">
                        <AlertCircle size={16} style={{ color: 'var(--accent-rose)', marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Asistencia Humana</div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0' }}><strong>{n.conversations?.user_name || 'Cliente'}</strong> necesita ayuda.</p>
                          <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(n.created_at).toLocaleTimeString()}</span>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => { markAsRead(n.id); window.location.href = `/inbox?id=${n.conversation_id}`; }}>Ver Chat</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button className="header-action-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="header-action-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-500)', borderColor: 'transparent' }} onClick={() => setShowAIModal(true)}>
            <Sparkles size={20} />
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />
          
          <div className="profile-avatar" onClick={handleLogout} title="Cerrar sesión">
            {tenant.membership?.full_name?.substring(0, 2).toUpperCase() || session?.user?.email?.substring(0, 2).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div className="main-content">
        <Outlet context={{ session, tenant }} />
      </div>
    </div>
  )
}
