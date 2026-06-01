import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import {
  Building, Users, Shield, Link2, Bell, Palette, Globe,
  Mail, Save, Plus, MoreHorizontal, Trash2, Edit, Crown,
  MessageSquare, Key, Database, Zap, CheckCircle2, UserPlus, X
} from 'lucide-react'

const settingsNav = [
  { id: 'workspace', icon: Building, label: 'Workspace' },
  { id: 'team', icon: Users, label: 'Equipo' },
  { id: 'roles', icon: Shield, label: 'Roles y Permisos' },
  { id: 'integrations', icon: Link2, label: 'Integraciones' },
  { id: 'notifications', icon: Bell, label: 'Notificaciones' },
  { id: 'api', icon: Key, label: 'API & Webhooks' },
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
  { name: 'Google Calendar', desc: 'Agendamiento automático de citas por IA', icon: '📅', connected: false, color: '#4285F4', isOAuth: true },
]

const roleDefinitions = [
  { name: 'admin', label: 'Administrador', desc: 'Acceso total al sistema', color: '#f43f5e', permissions: ['Todo'] },
  { name: 'vendedor', label: 'Vendedor', desc: 'Gestión de leads y ventas', color: '#6366f1', permissions: ['Dashboard', 'Inbox', 'Leads', 'Pipeline', 'Ventas'] },
  { name: 'soporte', label: 'Soporte', desc: 'Atención al cliente', color: '#06b6d4', permissions: ['Inbox', 'Clientes'] },
  { name: 'marketing', label: 'Marketing', desc: 'Campañas y análisis', color: '#10b981', permissions: ['Dashboard', 'Leads', 'Reportes', 'Automatizaciones'] },
]

const avatarGradients = [
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
]

export default function Settings() {
  const { session } = useOutletContext()
  const tenant = useTenant()
  const [activeSection, setActiveSection] = useState('workspace')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Team Members State (real data from DB)
  const [teamMembers, setTeamMembers] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', password: '', role: 'asesor', customRole: '', permissions: { view_inbox: true, view_crm: false, view_settings: false } })
  const [isInviting, setIsInviting] = useState(false)

  // Workspace Form State
  const [workspaceData, setWorkspaceData] = useState({
    companyName: '',
    whatsapp_token: '',
    prompt: '',
    email: '',
    timezone: 'America/Bogota (UTC-5)'
  })
  const [noWorkspace, setNoWorkspace] = useState(false)

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
      fetchSettings()
      fetchTeamMembers()
    } else if (!tenant.isLoading && !tenant.clientId) {
      setNoWorkspace(true)
      setIsLoading(false)
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchSettings = async () => {
    setIsLoading(true)
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', tenant.clientId)
      .single()

    if (client) {
      setWorkspaceData({
        id: client.id,
        companyName: client.name || 'Mi Empresa',
        whatsapp_token: client.whatsapp_token || '',
        prompt: client.prompt || '',
        email: client.email || session.user.email,
        timezone: client.timezone || 'America/Bogota (UTC-5)'
      })
      setNoWorkspace(false)
    } else {
      setNoWorkspace(true)
    }
    setIsLoading(false)
  }

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('client_id', tenant.clientId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setTeamMembers(data)
    }
  }

  const handleInitializeWorkspace = async () => {
    setIsSaving(true)
    const payload = {
      name: 'Nueva Empresa',
      user_id: session.user.id,
      phone_number_id: 'PENDIENTE',
      whatsapp_token: '',
      prompt: 'Eres un asistente de IA...'
    }

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([payload])
      .select('id')
      .single()
    
    if (!error && newClient) {
      // Create team_member entry for the creator as admin
      await supabase.from('team_members').insert({
        user_id: session.user.id,
        client_id: newClient.id,
        role: 'admin',
        full_name: session.user.email?.split('@')[0] || 'Admin',
        email: session.user.email,
        status: 'activo'
      })
      setShowSuccess(true)
      tenant.reload()
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
          whatsapp_token: workspaceData.whatsapp_token,
          prompt: workspaceData.prompt,
          email: workspaceData.email,
          updated_at: new Date().toISOString()
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

  const handleInviteUser = async (e) => {
    e.preventDefault()
    setIsInviting(true)

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          password: inviteForm.password,
          full_name: inviteForm.full_name,
          role: inviteForm.role === 'otro' ? inviteForm.customRole : inviteForm.role,
          permissions: inviteForm.permissions,
          client_id: tenant.clientId,
          admin_user_id: session.user.id,
        })
      })

      const result = await res.json()
      if (res.ok) {
        setShowInviteModal(false)
        setInviteForm({ full_name: '', email: '', password: '', role: 'asesor', customRole: '', permissions: { view_inbox: true, view_crm: false, view_settings: false } })
        fetchTeamMembers()
      } else {
        alert('Error: ' + (result.error || 'No se pudo crear el usuario'))
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message)
    }
    setIsInviting(false)
  }

  const handleRemoveMember = async (memberId, memberUserId) => {
    if (memberUserId === session.user.id) {
      alert('No puedes eliminarte a ti mismo')
      return
    }
    if (!confirm('¿Seguro que deseas eliminar este miembro?')) return

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (!error) fetchTeamMembers()
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
                      Detectamos que tu cuenta aún no tiene un espacio de trabajo configurado. 
                      Haz clic abajo para crear tu empresa y habilitar el CRM.
                    </p>
                    <button className="btn btn-primary" onClick={handleInitializeWorkspace} disabled={isSaving}>
                        {isSaving ? 'Creando entorno...' : 'Crear mi Empresa'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nombre de la empresa</label>
                      <input className="form-input" name="companyName" value={workspaceData.companyName} onChange={handleWorkspaceChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">WhatsApp Token</label>
                      <input className="form-input" name="whatsapp_token" value={workspaceData.whatsapp_token} onChange={handleWorkspaceChange} style={{ fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prompt del Agente IA</label>
                      <textarea className="form-input" name="prompt" value={workspaceData.prompt} onChange={handleWorkspaceChange} rows={4} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email de contacto</label>
                      <input className="form-input" name="email" value={workspaceData.email} onChange={handleWorkspaceChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Zona horaria</label>
                      <input className="form-input" name="timezone" value={workspaceData.timezone} onChange={handleWorkspaceChange} />
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
                  {tenant.isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                      <UserPlus size={16} /> Agregar Miembro
                    </button>
                  )}
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
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                          No hay miembros registrados. Agrega el primero.
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member, i) => (
                        <tr key={member.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar md" style={{ background: avatarGradients[i % avatarGradients.length] }}>
                                {member.full_name?.substring(0, 2).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{member.full_name || 'Usuario'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', textTransform: 'capitalize' }}>
                              {member.role}
                            </span>
                          </td>
                          <td><span className={`badge ${member.status === 'activo' ? 'emerald' : 'amber'}`}>{member.status}</span></td>
                          <td>
                            {tenant.isAdmin && member.user_id !== session.user.id && (
                              <div className="flex gap-2">
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={() => handleRemoveMember(member.id, member.user_id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
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
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {roleDefinitions.map((role, i) => {
                    const memberCount = teamMembers.filter(m => m.role === role.name).length
                    return (
                      <div key={i} className="card">
                        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                          <div className="flex items-center gap-3">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color }} />
                            <h4 style={{ fontWeight: 700 }}>{role.label}</h4>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{memberCount} miembros</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>{role.desc}</p>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {role.permissions.map((perm, j) => (
                            <span key={j} className="badge neutral">{perm}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
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
                      {int.isOAuth ? (
                         <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => alert("Para conectar Google Calendar de forma segura, necesitamos configurar tus credenciales (Client ID) de Google Cloud. Por favor contacta a soporte para habilitar esta integración avanzada.")}
                         >
                            Conectar cuenta
                         </button>
                      ) : (
                         <span className={`badge ${int.connected ? 'emerald' : 'neutral'}`} style={{ fontSize: '0.68rem' }}>
                           {int.connected ? 'Conectado' : 'Disponible'}
                         </span>
                      )}
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
                  { title: 'Notificaciones Push (Navegador/Celular)', desc: 'Recibe alertas nativas en tu dispositivo incluso si minimizas la pestaña', action: () => {
                    if (!('Notification' in window)) {
                       alert('Este navegador no soporta notificaciones de escritorio');
                    } else {
                       Notification.requestPermission().then(permission => {
                          if (permission === 'granted') alert('¡Notificaciones habilitadas con éxito!');
                          else alert('Permiso denegado por el usuario.');
                       });
                    }
                  }},
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
                      {notif.action ? (
                         <button className="btn btn-secondary btn-sm" onClick={notif.action}>Habilitar en este dispositivo</button>
                      ) : (
                         <div className={`toggle-switch ${i < 5 ? 'active' : ''}`} />
                      )}
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
                  <input className="form-input" defaultValue="https://nexuscrmia.vercel.app/api/webhooks" style={{ fontFamily: 'monospace', maxWidth: 500 }} />
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Agregar Miembro al Equipo</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInviteModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleInviteUser} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Nombre Completo</label>
                  <input type="text" required className="form-input" placeholder="Juan Pérez" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
                  <input type="email" required className="form-input" placeholder="juan@empresa.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Contraseña Temporal</label>
                  <input type="text" required className="form-input" placeholder="Min. 6 caracteres" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Rol</label>
                  <select className="form-input" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                    <option value="admin">Administrador</option>
                    <option value="asesor">Asesor</option>
                    <option value="finalizador">Finalizador</option>
                    <option value="agendamientos">Agendamientos</option>
                    <option value="otro">Otro (Especificar)</option>
                  </select>
                </div>
                {inviteForm.role === 'otro' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Especificar Rol</label>
                    <input type="text" required className="form-input" placeholder="Ej. Marketing" value={inviteForm.customRole} onChange={e => setInviteForm({...inviteForm, customRole: e.target.value})} />
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Permisos (Próximamente efectivos)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={inviteForm.permissions.view_inbox} onChange={e => setInviteForm({...inviteForm, permissions: {...inviteForm.permissions, view_inbox: e.target.checked}})} />
                        Ver Inbox (Chats)
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={inviteForm.permissions.view_crm} onChange={e => setInviteForm({...inviteForm, permissions: {...inviteForm.permissions, view_crm: e.target.checked}})} />
                        Ver CRM (Ventas)
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={inviteForm.permissions.view_settings} onChange={e => setInviteForm({...inviteForm, permissions: {...inviteForm.permissions, view_settings: e.target.checked}})} />
                        Administrar Configuración
                     </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isInviting}>
                  {isInviting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
