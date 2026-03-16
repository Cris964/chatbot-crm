import { useState } from 'react'
import {
  Search, Filter, Plus, MoreHorizontal, ArrowUpDown, Download, Upload,
  Mail, Phone, MapPin, Calendar, Tag, Star, Eye, Trash2, UserPlus,
  ChevronDown, CheckSquare, Square
} from 'lucide-react'

const leadsData = [
  { id: 1, name: 'María González', email: 'maria@empresa.com', phone: '+57 301 234 5678', company: 'TechCorp SA', source: 'WhatsApp', stage: 'Negociación', priority: 'Alta', score: 92, assigned: { name: 'Ana R.', avatar: 'AR', bg: '#ec4899' }, created: 'Mar 10, 2026', value: '$62,500', tags: ['Enterprise', 'Potencial Alto'] },
  { id: 2, name: 'Juan Pérez', email: 'juan@startup.io', phone: '+57 315 876 5432', company: 'StartUp IO', source: 'Instagram', stage: 'Interesado', priority: 'Alta', score: 85, assigned: { name: 'Miguel T.', avatar: 'MT', bg: '#6366f1' }, created: 'Mar 8, 2026', value: '$24,000', tags: ['Profesional', 'Demo'] },
  { id: 3, name: 'Ana Rodríguez', email: 'ana@digital.co', phone: '+57 320 111 2233', company: 'Digital Co', source: 'Formulario', stage: 'Contactado', priority: 'Media', score: 68, assigned: { name: 'Laura M.', avatar: 'LM', bg: '#06b6d4' }, created: 'Mar 6, 2026', value: '$15,800', tags: ['Starter'] },
  { id: 4, name: 'Carlos Medina', email: 'carlos@global.net', phone: '+57 310 444 5566', company: 'Global Net', source: 'Facebook', stage: 'Nuevo', priority: 'Baja', score: 42, assigned: { name: 'Diego S.', avatar: 'DS', bg: '#f59e0b' }, created: 'Mar 5, 2026', value: '$8,200', tags: ['Starter'] },
  { id: 5, name: 'Laura Sánchez', email: 'laura@media.com', phone: '+57 318 777 8899', company: 'Media Plus', source: 'Email', stage: 'Nuevo', priority: 'Media', score: 55, assigned: { name: 'Ana R.', avatar: 'AR', bg: '#ec4899' }, created: 'Mar 4, 2026', value: '$18,400', tags: ['Profesional'] },
  { id: 6, name: 'Roberto Díaz', email: 'roberto@clouds.dev', phone: '+57 300 222 3344', company: 'CloudsDev', source: 'WhatsApp', stage: 'Interesado', priority: 'Alta', score: 78, assigned: { name: 'Miguel T.', avatar: 'MT', bg: '#6366f1' }, created: 'Mar 3, 2026', value: '$35,000', tags: ['Enterprise', 'Referido'] },
  { id: 7, name: 'Patricia Morales', email: 'patricia@retail.co', phone: '+57 312 555 6677', company: 'Retail Co', source: 'Instagram', stage: 'Contactado', priority: 'Media', score: 61, assigned: { name: 'Laura M.', avatar: 'LM', bg: '#06b6d4' }, created: 'Mar 2, 2026', value: '$12,000', tags: ['Profesional'] },
  { id: 8, name: 'Fernando Castro', email: 'fernando@logis.com', phone: '+57 305 888 9900', company: 'Logis SA', source: 'Formulario', stage: 'Negociación', priority: 'Alta', score: 88, assigned: { name: 'Diego S.', avatar: 'DS', bg: '#f59e0b' }, created: 'Mar 1, 2026', value: '$48,000', tags: ['Enterprise', 'Urgente'] },
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [isAddingLead, setIsAddingLead] = useState(false)
  const [leads, setLeads] = useState(leadsData)
  const [selected, setSelected] = useState([])

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'Todos' || lead.source === activeTab
    return matchesSearch && matchesTab
  })

  const handleAddLead = () => {
    setIsAddingLead(true)
    setTimeout(() => setIsAddingLead(false), 1000)
    // In a real app this would open a modal
  }

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
            <button className="btn btn-secondary"><Upload size={16} /> Importar</button>
            <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
            <button className="btn btn-primary" onClick={handleAddLead}>
              {isAddingLead ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={16} />}
              {isAddingLead ? 'Añadiendo...' : 'Nuevo Lead'}
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
          <button className="btn btn-secondary border-btn"><Filter size={16} /> Filtros</button>
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
              <th>Asignado</th>
              <th>Creado</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="table-row-hover" style={{ cursor: 'pointer' }}>
                <td onClick={() => toggleSelect(lead.id)}>
                  {selected.includes(lead.id)
                    ? <CheckSquare size={18} style={{ color: 'var(--primary-400)' }} />
                    : <Square size={18} style={{ color: 'var(--text-tertiary)' }} />
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar sm" style={{ background: lead.assigned.bg }}>{lead.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{lead.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.company} • {lead.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${getSourceBadge(lead.source)}`}>{lead.source}</span></td>
                <td><span className={`badge ${getStageBadge(lead.stage)}`}>{lead.stage}</span></td>
                <td><span className={`badge ${getPriorityBadge(lead.priority)}`}>{lead.priority}</span></td>
                <td><ScoreBadge score={lead.score} /></td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{lead.value}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="avatar sm" style={{ background: lead.assigned.bg, width: 24, height: 24, fontSize: '0.6rem' }}>{lead.assigned.avatar}</div>
                    <span style={{ fontSize: '0.82rem' }}>{lead.assigned.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{lead.created}</td>
                <td>
                  <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No se encontraron leads con la búsqueda "{searchQuery}"
          </div>
        )}
      </div>

      <div className="pagination" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          Mostrando <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>1-{filteredLeads.length}</span> de <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{filteredLeads.length}</span> leads
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm">← Anterior</button>
          <button className="btn btn-sm" style={{ background: 'var(--primary-600)', color: 'white', borderRadius: 'var(--radius-sm)' }}>1</button>
          <button className="btn btn-ghost btn-sm">2</button>
          <button className="btn btn-ghost btn-sm">3</button>
          <button className="btn btn-ghost btn-sm">...</button>
          <button className="btn btn-ghost btn-sm">356</button>
          <button className="btn btn-ghost btn-sm">Siguiente →</button>
        </div>
      </div>
    </div>
  )
}
