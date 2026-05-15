import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { User, Shield, Key, Mail, Plus, MoreVertical, UserPlus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'

const avatarGradients = [
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
]

export default function UsersPage() {
  const { session } = useOutletContext()
  const tenant = useTenant()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
      fetchUsers()
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchUsers = async () => {
    setIsLoading(true)
    // Read from team_members table scoped to the current company
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('client_id', tenant.clientId)
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      setUsers(data)
    }
    setIsLoading(false)
  }

  const getRoleBadge = (role) => {
    const map = { admin: 'rose', vendedor: 'purple', soporte: 'cyan', marketing: 'emerald' }
    return map[role] || 'neutral'
  }

  const getRoleLabel = (role) => {
    const map = { admin: 'Administrador', vendedor: 'Vendedor', soporte: 'Soporte', marketing: 'Marketing' }
    return map[role] || role
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administra los accesos y roles de tu equipo — {tenant.clientName}</p>
          </div>
          {tenant.isAdmin && (
            <button className="btn btn-primary" onClick={() => window.location.href = '/configuracion'}>
              <UserPlus size={16} /> Invitar Usuario
            </button>
          )}
        </div>
      </div>

      <div className="card animate-slideUp stagger-1" style={{ marginTop: 24 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Cargando equipo...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                  No hay usuarios registrados. Ve a Configuración → Equipo para agregar miembros.
                </td>
              </tr>
            ) : (
              users.map((user, i) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar sm" style={{ background: avatarGradients[i % avatarGradients.length] }}>
                        {user.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.full_name || 'Usuario'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      <Shield size={12} style={{ marginRight: 4 }} /> {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'activo' ? 'emerald' : 'amber'}`}>{user.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {tenant.isAdmin && user.user_id !== session.user.id && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={async () => {
                        if (confirm('¿Eliminar este miembro?')) {
                          await supabase.from('team_members').delete().eq('id', user.id)
                          fetchUsers()
                        }
                      }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
