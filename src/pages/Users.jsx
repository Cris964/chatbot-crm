import { useState, useEffect } from 'react'
import { User, Shield, Key, Mail, Plus, MoreVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    // Note: Supabase auth.users is protected. 
    // Usually, we have a public.users or public.profiles table.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
    
    if (!error && data) {
      setUsers(data)
    }
    setIsLoading(false)
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administra los accesos y roles de tu equipo</p>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Próximamente: Invitar usuario')}>
            <Plus size={16} /> Invitar Usuario
          </button>
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
            {users.length === 0 && !isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                  No hay otros usuarios registrados o la tabla 'profiles' no existe.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar sm">{user.full_name?.substring(0,2) || 'U'}</div>
                      <span style={{ fontWeight: 600 }}>{user.full_name || 'Usuario'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge amber">
                      <Shield size={12} style={{ marginRight: 4 }} /> Admin
                    </span>
                  </td>
                  <td>
                    <span className="badge emerald">Activo</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm"><MoreVertical size={16} /></button>
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
