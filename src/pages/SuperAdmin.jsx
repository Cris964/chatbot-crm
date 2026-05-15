import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import {
  Building, Plus, Users, Package, Settings, Eye, Trash2, Edit,
  ShieldCheck, Search, X, CheckCircle2, AlertTriangle, UserPlus,
  MessageSquare, Database
} from 'lucide-react'

const SUPER_ADMIN_EMAILS = ['admin@chekadmin.com', 'naturel@admin.com']

export default function SuperAdmin() {
  const { session } = useOutletContext()
  const tenant = useTenant()
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('companies')

  // Company creation
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [companyForm, setCompanyForm] = useState({ name: '', phone_number_id: '', whatsapp_token: '', prompt: '' })
  const [isSaving, setIsSaving] = useState(false)

  // User creation for a specific company
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'admin' })
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Guard: only super admins
  if (!SUPER_ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase())) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <ShieldCheck size={48} style={{ color: 'var(--accent-rose)', marginBottom: 16 }} />
          <h2>Acceso Restringido</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 8 }}>Solo el Super Administrador puede acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    // Super admin: use service role or direct query (RLS allows owner access)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      // For each company, get member count
      const enriched = await Promise.all(data.map(async (c) => {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', c.id)
        
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', c.id)

        return { ...c, memberCount: count || 0, productCount: productCount || 0 }
      }))
      setCompanies(enriched)
    }
    setIsLoading(false)
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        name: companyForm.name,
        phone_number_id: companyForm.phone_number_id || 'PENDIENTE',
        whatsapp_token: companyForm.whatsapp_token || '',
        prompt: companyForm.prompt || 'Eres un asistente de IA amable y profesional.',
        user_id: session.user.id,
      })
      .select('id')
      .single()

    if (!error && newClient) {
      setShowCreateCompany(false)
      setCompanyForm({ name: '', phone_number_id: '', whatsapp_token: '', prompt: '' })
      fetchCompanies()
    } else {
      alert('Error: ' + (error?.message || 'Unknown'))
    }
    setIsSaving(false)
  }

  const handleCreateUserForCompany = async (e) => {
    e.preventDefault()
    setIsCreatingUser(true)

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password,
          full_name: userForm.full_name,
          role: userForm.role,
          client_id: selectedCompanyId,
          admin_user_id: session.user.id,
        })
      })
      const result = await res.json()
      if (res.ok) {
        setShowCreateUser(false)
        setUserForm({ full_name: '', email: '', password: '', role: 'admin' })
        fetchCompanies()
        alert(`✅ Usuario ${result.user.email} creado exitosamente como ${result.user.role}`)
      } else {
        alert('Error: ' + (result.error || 'No se pudo crear'))
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message)
    }
    setIsCreatingUser(false)
  }

  return (
    <div className="page-content" style={{ padding: 32 }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
              <div style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="white" />
                <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Super Admin</span>
              </div>
            </div>
            <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Panel de Empresas</h1>
            <p className="page-subtitle">Gestión centralizada de todas las empresas del CRM SaaS</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateCompany(true)}>
            <Plus size={18} /> Nueva Empresa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-card-header" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Empresas Totales</span>
          </div>
          <div className="stat-card-value">{companies.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Usuarios Totales</span>
          </div>
          <div className="stat-card-value">{companies.reduce((s, c) => s + c.memberCount, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Productos Totales</span>
          </div>
          <div className="stat-card-value">{companies.reduce((s, c) => s + c.productCount, 0)}</div>
        </div>
      </div>

      {/* Companies Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>Cargando empresas...</p>
          </div>
        ) : companies.map(company => (
          <div key={company.id} className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={22} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{company.name}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{company.id?.slice(0, 12)}...</span>
                </div>
              </div>
              <span className={`badge ${company.phone_number_id && company.phone_number_id !== 'PENDIENTE' ? 'emerald' : 'amber'}`} style={{ fontSize: '0.65rem' }}>
                {company.phone_number_id && company.phone_number_id !== 'PENDIENTE' ? 'WA Activo' : 'Sin WhatsApp'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>{company.memberCount}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Usuarios</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{company.productCount}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Productos</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {company.prompt ? '✓' : '✗'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Agente IA</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setSelectedCompanyId(company.id); setShowCreateUser(true); }}>
                <UserPlus size={14} /> Crear Usuario
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => alert(`ID: ${company.id}\nWhatsApp: ${company.phone_number_id}\nToken: ${company.whatsapp_token ? '***' + company.whatsapp_token.slice(-8) : 'N/A'}`)}>
                <Eye size={14} /> Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 540, padding: 0 }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>Crear Nueva Empresa</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateCompany(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCompany} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Nombre de la Empresa *</label>
                  <input type="text" required className="form-input" placeholder="Ej: Mi Tienda Online" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Phone Number ID (WhatsApp)</label>
                  <input type="text" className="form-input" placeholder="Ej: 123456789012345" style={{ fontFamily: 'monospace' }} value={companyForm.phone_number_id} onChange={e => setCompanyForm({...companyForm, phone_number_id: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>WhatsApp Token</label>
                  <input type="text" className="form-input" placeholder="Token de Meta Business" style={{ fontFamily: 'monospace' }} value={companyForm.whatsapp_token} onChange={e => setCompanyForm({...companyForm, whatsapp_token: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Prompt del Agente IA</label>
                  <textarea className="form-input" rows={3} placeholder="Eres un asistente de ventas amable..." value={companyForm.prompt} onChange={e => setCompanyForm({...companyForm, prompt: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCompany(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Creando...' : 'Crear Empresa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 480, padding: 0 }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800 }}>Crear Usuario</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Empresa: {companies.find(c => c.id === selectedCompanyId)?.name}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateUser(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUserForCompany} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Nombre Completo *</label>
                  <input type="text" required className="form-input" placeholder="Juan Pérez" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Email *</label>
                  <input type="email" required className="form-input" placeholder="juan@empresa.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Contraseña *</label>
                  <input type="text" required className="form-input" placeholder="Min. 6 caracteres" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Rol</label>
                  <select className="form-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="soporte">Soporte</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUser(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingUser}>{isCreatingUser ? 'Creando...' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
