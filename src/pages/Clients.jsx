import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, Plus, Mail, Phone, MapPin, Calendar,
  MoreHorizontal, ExternalLink, DollarSign, ShoppingBag,
  MessageSquare, Star, Building, ChevronDown, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Clients() {
  const { session } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    status: 'Activo'
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchClients()
    }
  }, [session?.user?.id])

  const fetchClients = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
      if (data && data.length > 0 && !selectedClient) {
        setSelectedClient(data[0])
      }
    }
    setIsLoading(false)
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    const clientToInsert = {
      ...newClient,
      user_id: session.user.id,
      avatar: newClient.name.substring(0, 2).toUpperCase(),
      bg: 'linear-gradient(135deg, #10b981, #06b6d4)',
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('clients')
      .insert([clientToInsert])

    if (error) {
      alert('Error al añadir cliente: ' + error.message)
    } else {
      setShowModal(false)
      setNewClient({
        name: '', email: '', phone: '', company: '', location: '', status: 'Activo'
      })
      fetchClients()
    }
    setIsSaving(false)
  }

  const filteredClients = clients.filter(client => 
    (client.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (client.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (client.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">Directorio completo de clientes con historial y métricas</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => alert('Filtros avanzados próximamente')}><Filter size={16} /> Filtros</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nuevo Cliente</button>
          </div>
        </div>
      </div>

      <div className="filters-bar animate-slideUp stagger-1">
        <div className="header-search" style={{ maxWidth: 280 }}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar clientes, correos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn">Estado <ChevronDown size={13} /></button>
        <button className="filter-btn">Etiqueta <ChevronDown size={13} /></button>
        <button className="filter-btn">LTV <ChevronDown size={13} /></button>
      </div>

      {isLoading && clients.length === 0 ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Cargando clientes...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Client Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredClients.map((client, i) => (
              <div 
                key={client.id} 
                className={`card animate-slideUp stagger-${Math.min(i + 1, 6)} ${selectedClient?.id === client.id ? 'border-primary' : ''}`} 
                style={{ cursor: 'pointer', borderColor: selectedClient?.id === client.id ? 'var(--primary-500)' : 'var(--border-default)' }}
                onClick={() => setSelectedClient(client)}
              >
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="avatar lg" style={{ background: client.bg || 'var(--primary-600)' }}>{client.avatar || client.name.substring(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{client.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          <Building size={14} /> {client.company || 'Empresa no reg.'}
                        </div>
                      </div>
                      <span className={`badge ${client.status === 'Activo' ? 'emerald' : 'neutral'}`}>{client.status || 'Activo'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                        <Mail size={14} /> {client.email || 'Sin email'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                        <MapPin size={14} /> {client.location || 'Sin ubicación'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>VALOR TOTAL</div>
                        <div style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{client.ltv || '$0'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>COMPRAS</div>
                        <div style={{ fontWeight: 700 }}>{client.purchases || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>CLIENTE DESDE</div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Reciente'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }} className="card">
                No hay clientes registrados aún.
              </div>
            )}
          </div>

          {/* Client Detail View */}
          <div>
            {selectedClient ? (
              <div className="card animate-slideUp stagger-2" style={{ position: 'sticky', top: 0 }}>
                <div className="card-header">
                  <h3 className="card-title">Detalle del Cliente</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert('Enlace externo')}><ExternalLink size={16} /></button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div className="avatar xl" style={{ background: selectedClient.bg || 'var(--primary-600)', margin: '0 auto 10px' }}>{selectedClient.avatar || selectedClient.name.substring(0, 2).toUpperCase()}</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{selectedClient.name}</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{selectedClient.company || 'Empresa individual'} • {selectedClient.location || 'Sin ubicación'}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                    <DollarSign size={20} style={{ color: 'var(--accent-emerald)', margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedClient.ltv || '$0'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Valor Total</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                    <ShoppingBag size={20} style={{ color: 'var(--primary-400)', margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedClient.purchases || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Compras</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>Información General</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Email:</span>
                      <span style={{ fontWeight: 500 }}>{selectedClient.email || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Teléfono:</span>
                      <span style={{ fontWeight: 500 }}>{selectedClient.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => alert('Navegar a Inbox')}><MessageSquare size={14} /> Enviar mensaje</button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => alert('Llamar')}><Phone size={14} /> Llamar</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ position: 'sticky', top: 0, padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Selecciona un cliente para ver sus detalles
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
              <h3 className="card-title">Nuevo Cliente</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddClient} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Nombre Completo</label>
                  <input 
                    type="text" required className="input" placeholder="Ej: Juan Pérez" 
                    value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input 
                    type="email" required className="input" placeholder="juan@correo.com" 
                    value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Teléfono</label>
                  <input 
                    type="text" className="input" placeholder="+57 300..." 
                    value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Empresa</label>
                  <input 
                    type="text" className="input" placeholder="Nombre de la empresa" 
                    value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Ubicación</label>
                  <input 
                    type="text" className="input" placeholder="Ciudad, País" 
                    value={newClient.location} onChange={e => setNewClient({...newClient, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
