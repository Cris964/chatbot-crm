import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Building, Users, Shield, Link2, Bell, Palette, Globe,
  Mail, Save, Plus, MoreHorizontal, Trash2, Edit, Crown,
  MessageSquare, Key, Database, Zap, CheckCircle2
} from 'lucide-react'

const settingsNav = [
  { id: 'workspace', icon: Building, label: 'Workspace' },
  { id: 'team', icon: Users, label: 'Equipo' },
  { id: 'roles', icon: Shield, label: 'Roles y Permisos' },
  { id: 'integrations', icon: Link2, label: 'Integraciones' },
  { id: 'notifications', icon: Bell, label: 'Notificaciones' },
  { id: 'api', icon: Key, label: 'API & Webhooks' },
]

const teamMembers = [
  { name: 'Admin', email: 'admin@naturel.com', role: 'Administrador', status: 'Activo', avatar: 'AD', bg: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { name: 'Ana Rodríguez', email: 'ana@naturel.com', role: 'Vendedor', status: 'Activo', avatar: 'AR', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { name: 'Miguel Torres', email: 'miguel@naturel.com', role: 'Vendedor', status: 'Activo', avatar: 'MT', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { name: 'Laura Méndez', email: 'laura@naturel.com', role: 'Soporte', status: 'Activo', avatar: 'LM', bg: 'linear-gradient(135deg, #06b6d4, #10b981)' },
  { name: 'Diego Salazar', email: 'diego@naturel.com', role: 'Vendedor', status: 'Activo', avatar: 'DS', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Patricia Morales', email: 'patricia@naturel.com', role: 'Marketing', status: 'Invitado', avatar: 'PM', bg: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
]

const integrations = [
  { name: 'WhatsApp Business', desc: 'API oficial de WhatsApp', icon: '💬', connected: true, color: '#25d366' },
  { name: 'Instagram', desc: 'Instagram Graph API', icon: '📷', connected: true, color: '#e1306c' },
  { name: 'Facebook Messenger', desc: 'Messenger Platform', icon: '💭', connected: true, color: '#0084ff' },
  { name: 'Gmail / SMTP', desc: 'Correos entrantes y salientes', icon: '📧', connected: true, color: '#ea4335' },
  { name: 'Stripe', desc: 'Procesamiento de pagos', icon: '💳', connected: false, color: '#635bff' },
  { name: 'Shopify', desc: 'E-commerce sync', icon: '🛒', connected: false, color: '#96bf48' },
  { name: 'Zapier', desc: 'Automatizaciones externas', icon: '⚡', connected: false, color: '#ff4a00' },
  { name: 'Google Analytics', desc: 'Tracking y analítica', icon: '📊', connected: true, color: '#f59e0b' },
  { name: 'Slack', desc: 'Notificaciones de equipo', icon: '💼', connected: false, color: '#4a154b' },
  { name: 'Calendly', desc: 'Agendamiento de citas', icon: '📅', connected: false, color: '#006bff' },
]

const roles = [
  { name: 'Administrador', desc: 'Acceso total al sistema', members: 1, permissions: ['Todo'], color: '#f43f5e' },
  { name: 'Supervisor', desc: 'Gestión de equipo y reportes', members: 0, permissions: ['Dashboard', 'Leads', 'Pipeline', 'Reportes', 'Equipo'], color: '#8b5cf6' },
  { name: 'Vendedor', desc: 'Gestión de leads y ventas', members: 3, permissions: ['Dashboard', 'Inbox', 'Leads', 'Pipeline', 'Ventas'], color: '#6366f1' },
  { name: 'Soporte', desc: 'Atención al cliente', members: 1, permissions: ['Inbox', 'Clientes'], color: '#06b6d4' },
  { name: 'Marketing', desc: 'Campañas y análisis', members: 1, permissions: ['Dashboard', 'Leads', 'Reportes', 'Automatizaciones'], color: '#10b981' },
]

export default function Settings() {
  const { session } = useOutletContext()
  const [activeSection, setActiveSection] = useState('workspace')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Workspace Form State
  const [workspaceData, setWorkspaceData] = useState({
    companyName: 'Naturel',
    slug: 'naturel',
    email: 'email@dominio.com',
    timezone: 'America/Bogota (UTC-5)'
  })
  const [noWorkspace, setNoWorkspace] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchSettings()
    }
  }, [session])

  const fetchSettings = async () => {
    setIsLoading(true)
    // Get the client record associated with this user
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)

    if (clients && clients.length > 0) {
      const client = clients[0]
      setWorkspaceData({
        id: client.id,
        companyName: client.name || 'Mi Empresa',
        slug: client.slug || (client.name || 'mi-empresa').toLowerCase()?.replace(/\s+/g, '-'),
        email: client.email || session.user.email,
        timezone: client.timezone || 'America/Bogota (UTC-5)'
      })
      setNoWorkspace(false)
    } else {
      setNoWorkspace(true)
    }
    setIsLoading(false)
  }

  const handleInitializeWorkspace = async () => {
    setIsSaving(true)
    // Usamos el ID de cliente que encontramos vinculado a los pedidos existentes para restaurar la conexión
    const NEW_CLIENT_ID = '98b9fafd-90ad-4ed9-9616-b8ed992b0e7d'
    
    const { error } = await supabase
      .from('clients')
      .upsert([{ 
        id: NEW_CLIENT_ID,
        name: 'Naturel',
        user_id: session.user.id
      }])
    
    if (!error) {
       setShowSuccess(true)
       fetchSettings()
    } else {
       console.error("Error initializing workspace:", error)
       alert("Error al inicializar: " + error.message)
    }
    setIsSaving(false)
  }

  const handleWorkspaceChange = (e) => {
    setWorkspaceData({ ...workspaceData, [e.target.name]: e.target.value })
  }

  const handleSaveWorkspace = async () => {
    setIsSaving(true)
    setShowSuccess(false)
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          name: workspaceData.companyName,
          slug: workspaceData.slug,
          email: workspaceData.email,
          updated_at: new Date().toISOString()
          // We can add more fields if the schema supports it, otherwise metadata
        })
        .eq('id', workspaceData.id)

      if (!error) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        console.error("Error saving settings:", error)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">Administra tu workspace, equipo e integraciones</p>
      </div>

      <div className="settings-layout animate-slideUp stagger-1">
        <nav className="settings-nav">
          {settingsNav.map(item => (
            <div
              key={item.id}
              className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="settings-content">
          {activeSection === 'workspace' && (
            <>
              <div className="settings-section">
                <h3>Información del Workspace</h3>
                <p>Configura la información general de tu empresa en la plataforma</p>

                {noWorkspace ? (
                  <div className="card" style={{ padding: 32, textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary-400)' }}>
                    <Database size={40} style={{ color: 'var(--primary-400)', marginBottom: 16 }} />
                    <h4 style={{ marginBottom: 8 }}>Workspace no inicializado</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
                      Detectamos que tu cuenta no está vinculada a un Workspace de Naturel. 
                      Haz clic abajo para restaurar la conexión y ver tus mensajes y leads.
                    </p>
                    <button className="btn btn-primary" onClick={handleInitializeWorkspace} disabled={isSaving}>
                        {isSaving ? 'Inicializando...' : 'Vincular mi cuenta a Naturel'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nombre de la empresa</label>
                      <input className="form-input" name="companyName" value={workspaceData.companyName} onChange={handleWorkspaceChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slug</label>
                      <input className="form-input" name="slug" value={workspaceData.slug} onChange={handleWorkspaceChange} style={{ fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email de contacto</label>
                      <input className="form-input" name="email" value={workspaceData.email} onChange={handleWorkspaceChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Zona horaria</label>
                      <input className="form-input" name="timezone" value={workspaceData.timezone} onChange={handleWorkspaceChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Plan actual</label>
                      <div className="flex items-center gap-3">
                        <span className="badge purple" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                          <Crown size={14} /> Enterprise
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Renovación: Dic 31, 2026</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSaveWorkspace}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Save size={16} />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                      </button>

                      {showSuccess && (
                        <span className="badge emerald" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', animation: 'slideUp 0.3s ease-out' }}>
                          <CheckCircle2 size={16} /> Guardado exitosamente
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeSection === 'team' && (
            <>
              <div className="settings-section">
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <div>
                    <h3>Miembros del Equipo</h3>
                    <p>Administra los usuarios que tienen acceso a tu workspace</p>
                  </div>
                  <button className="btn btn-primary"><Plus size={16} /> Invitar Miembro</button>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Miembro</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar md" style={{ background: member.bg }}>{member.avatar}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{member.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge purple">{member.role}</span></td>
                        <td><span className={`badge ${member.status === 'Activo' ? 'emerald' : 'amber'}`}>{member.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm"><Edit size={14} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'roles' && (
            <>
              <div className="settings-section">
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <div>
                    <h3>Roles y Permisos</h3>
                    <p>Define los permisos de acceso para cada tipo de usuario</p>
                  </div>
                  <button className="btn btn-primary"><Plus size={16} /> Nuevo Rol</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {roles.map((role, i) => (
                    <div key={i} className="card">
                      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color }} />
                          <h4 style={{ fontWeight: 700 }}>{role.name}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{role.members} miembros</span>
                        </div>
                        <button className="btn btn-ghost btn-sm"><Edit size={14} /></button>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>{role.desc}</p>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {role.permissions.map((perm, j) => (
                          <span key={j} className="badge neutral">{perm}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'integrations' && (
            <>
              <div className="settings-section">
                <h3>Integraciones</h3>
                <p>Conecta tu CRM con las plataformas que usas a diario</p>

                <div className="integration-grid" style={{ marginTop: 16 }}>
                  {integrations.map((int, i) => (
                    <div key={i} className="integration-card">
                      <div className="int-icon" style={{ background: `${int.color}20`, fontSize: '1.3rem' }}>
                        {int.icon}
                      </div>
                      <div className="int-info" style={{ flex: 1 }}>
                        <h4>{int.name}</h4>
                        <p>{int.desc}</p>
                      </div>
                      <span className={`badge ${int.connected ? 'emerald' : 'neutral'}`} style={{ fontSize: '0.68rem' }}>
                        {int.connected ? 'Conectado' : 'Disponible'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <div className="settings-section">
                <h3>Preferencias de Notificaciones</h3>
                <p>Configura cómo y cuándo recibir alertas del sistema</p>

                {[
                  { title: 'Nuevo lead capturado', desc: 'Recibe una alerta cuando un nuevo lead entre al sistema' },
                  { title: 'Conversación escalada', desc: 'Alerta cuando el chatbot escala una conversación a humano' },
                  { title: 'Intención de compra', desc: 'La IA detecta un cliente con potencial de compra' },
                  { title: 'Deal cerrado', desc: 'Notificación cuando se cierra una venta' },
                  { title: 'Despacho entregado', desc: 'Confirmación de entrega de un pedido' },
                  { title: 'Recordatorio de seguimiento', desc: 'Leads sin contactar en más de 24h' },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between" style={{
                    padding: '14px 0', borderBottom: '1px solid var(--border-default)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{notif.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{notif.desc}</div>
                    </div>
                    <div className="flex gap-3">
                      <div className={`toggle-switch ${i < 4 ? 'active' : ''}`} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary mt-4"><Save size={16} /> Guardar Preferencias</button>
              </div>
            </>
          )}

          {activeSection === 'api' && (
            <>
              <div className="settings-section">
                <h3>API & Webhooks</h3>
                <p>Gestiona tus credenciales de API y endpoints de webhooks</p>

                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <div className="flex gap-2">
                    <input className="form-input" defaultValue="nxcrm_live_sk_7f8g9h..." type="password" style={{ fontFamily: 'monospace' }} />
                    <button className="btn btn-secondary">Copiar</button>
                    <button className="btn btn-secondary" style={{ color: 'var(--accent-rose)' }}>Regenerar</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Webhook URL</label>
                  <input className="form-input" defaultValue="https://api.yourapp.com/webhooks/nexuscrm" style={{ fontFamily: 'monospace', maxWidth: 500 }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Eventos del Webhook</label>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                    {['lead.created', 'lead.updated', 'deal.closed', 'conversation.escalated', 'dispatch.delivered'].map((event, i) => (
                      <span key={i} className="badge purple" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{event}</span>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary mt-4"><Save size={16} /> Guardar Configuración</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
