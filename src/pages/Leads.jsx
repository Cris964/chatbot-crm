import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, Plus, MoreHorizontal, ArrowUpDown, Download, Upload,
  Mail, Phone, MapPin, Calendar, Tag, Star, Eye, Trash2, UserPlus,
  ChevronDown, CheckSquare, Square, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function getSourceBadge(source) {
  const map = { 'WhatsApp': 'emerald', 'Instagram': 'pink', 'Facebook': 'cyan', 'Formulario': 'purple', 'Email': 'amber' }
  return map[source] || 'neutral'
}

function getStageBadge(stage) {
  const map = { 'Nuevo': 'purple', 'Contactado': 'cyan', 'Interesado': 'violet', 'Negociación': 'amber', 'Venta Cerrada': 'emerald', 'Venta Perdida': 'rose' }
  return map[stage] || 'neutral'
}

function getPriorityBadge(priority) {
  const map = { 'Alta': 'rose', 'Media': 'amber', 'Baja': 'neutral' }
  return map[priority] || 'neutral'
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#6b6b80'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 48, height: 5, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{score}</span>
    </div>
  )
}

export default function Leads() {
  const { session } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [isAddingLead, setIsAddingLead] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState([])
  
  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'WhatsApp',
    stage: 'Nuevo',
    priority: 'Media',
    value: ''
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads()
    }
  }, [session?.user?.id])

  const fetchLeads = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
    } else {
      setLeads(data || [])
    }
    setIsLoading(false)
  }

  const handleAddLead = async (e) => {
    e.preventDefault()
    setIsAddingLead(true)
    
    const leadToInsert = {
      ...newLead,
      user_id: session.user.id,
      score: Math.floor(Math.random() * 40) + 30, // Random initial score
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('leads')
      .insert([leadToInsert])

    if (insertError && insertError.code === 'PGRST204') {
      // Table doesn't exist, fallback to clients
      const { error: clientError } = await supabase
        .from('clients')
        .insert([{
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          user_id: session.user.id,
          revenue: 0,
          created_at: new Date().toISOString()
        }])
      
      if (clientError) {
        alert('Error al añadir (fallback): ' + clientError.message)
      } else {
        setShowModal(false)
        setNewLead({
          name: '', email: '', phone: '', company: '',
          source: 'WhatsApp', stage: 'Nuevo', priority: 'Media', value: ''
        })
        fetchLeads()
      }
    } else if (insertError) {
      alert('Error al añadir lead: ' + insertError.message)
    } else {
      setShowModal(false)
      setNewLead({
        name: '', email: '', phone: '', company: '',
        source: 'WhatsApp', stage: 'Nuevo', priority: 'Media', value: ''
      })
      fetchLeads()
    }
    setIsAddingLead(false)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (lead.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (lead.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'Todos' || lead.source === activeTab
    return matchesSearch && matchesTab
  })

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Leads</h1>
            <p className="page-subtitle">Gestiona y organiza todos tus leads desde un solo lugar</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => alert('Función de importar próximamente')}><Upload size={16} /> Importar</button>
            <button className="btn btn-secondary" onClick={() => alert('Función de exportar próximamente')}><Download size={16} /> Exportar</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nuevo Lead
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for filtering by source */}
      <div className="tabs animate-slideUp stagger-2" style={{ marginBottom: 20 }}>
        {['Todos', 'WhatsApp', 'Instagram', 'Formulario', 'Facebook', 'Email'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar animate-slideUp stagger-1">
        <div className="flex gap-3">
          <div className="search-bar" style={{ minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, email, empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary border-btn" onClick={() => alert('Filtros avanzados próximamente')}><Filter size={16} /> Filtros</button>
        </div>
        <button className="filter-btn">Etapa <ChevronDown size={13} /></button>
        <button className="filter-btn">Prioridad <ChevronDown size={13} /></button>
        <button className="filter-btn">Asignado <ChevronDown size={13} /></button>
        {selected.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selected.length} seleccionados</span>
            <button className="btn btn-sm btn-secondary"><Tag size={14} /> Etiquetar</button>
            <button className="btn btn-sm btn-secondary"><UserPlus size={14} /> Asignar</button>
            <button className="btn btn-sm btn-secondary" style={{ color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card animate-slideUp stagger-2" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>Cargando leads...</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th><div className="flex items-center gap-2 cursor-pointer">Lead <ArrowUpDown size={13} /></div></th>
                  <th>Fuente</th>
                  <th>Etapa</th>
                  <th>Prioridad</th>
                  <th>Score</th>
                  <th>Valor</th>
                  <th>Creado</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="table-row-hover" style={{ cursor: 'pointer' }}>
                    <td onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }}>
                      {selected.includes(lead.id)
                        ? <CheckSquare size={18} style={{ color: 'var(--primary-400)' }} />
                        : <Square size={18} style={{ color: 'var(--text-tertiary)' }} />
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar sm" style={{ background: 'var(--primary-600)' }}>{lead.name?.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{lead.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.company} • {lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${getSourceBadge(lead.source)}`}>{lead.source}</span></td>
                    <td><span className={`badge ${getStageBadge(lead.stage)}`}>{lead.stage}</span></td>
                    <td><span className={`badge ${getPriorityBadge(lead.priority)}`}>{lead.priority}</span></td>
                    <td><ScoreBadge score={lead.score || 0} /></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{lead.value || '$0'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                {searchQuery ? `No se encontraron leads con la búsqueda "${searchQuery}"` : 'No hay leads registrados aún.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Lead Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
              <h3 className="card-title">Nuevo Lead</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddLead} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Nombre Completo</label>
                  <input 
                    type="text" required className="input" placeholder="Ej: María González" 
                    value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input 
                    type="email" required className="input" placeholder="maria@correo.com" 
                    value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Teléfono</label>
                  <input 
                    type="text" className="input" placeholder="+57 300..." 
                    value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Empresa</label>
                  <input 
                    type="text" className="input" placeholder="Nombre de la empresa" 
                    value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Fuente</label>
                  <select className="input" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                    <option>WhatsApp</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>Formulario</option>
                    <option>Email</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Prioridad</label>
                  <select className="input" value={newLead.priority} onChange={e => setNewLead({...newLead, priority: e.target.value})}>
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Valor Estimado</label>
                  <input 
                    type="text" className="input" placeholder="$ 0.00" 
                    value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isAddingLead}>
                  {isAddingLead ? 'Guardando...' : 'Crear Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
