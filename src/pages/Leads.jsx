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

function ScoreBadge({ score, onScoreChange }) {
  const stars = [1, 2, 3, 4, 5]
  const rating = Math.ceil(score / 20) || 0
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {stars.map(s => (
        <Star 
          key={s} 
          size={16} 
          fill={s <= rating ? 'var(--accent-amber)' : 'transparent'} 
          color={s <= rating ? 'var(--accent-amber)' : 'var(--text-tertiary)'}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onClick={() => onScoreChange(s * 20)}
          className="hover-scale"
        />
      ))}
      <span style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: 8, color: 'var(--text-tertiary)' }}>{score}%</span>
    </div>
  )
}

export default function Leads() {
  const { session } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isAddingLead, setIsAddingLead] = useState(false)
  
  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'WhatsApp',
    stage: 'Nuevo',
    score: 0,
    value: ''
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads()
    }
  }, [session?.user?.id])

  const fetchLeads = async () => {
    setIsLoading(true)
    
    // 1. Get client IDs for multitenancy
    const { data: clients } = await supabase.from('clients').select('id').eq('user_id', session.user.id)
    const clientIds = clients?.map(c => c.id) || []

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .in('client_id', clientIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
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
      score: Math.floor(Math.random() * 40) + 30, 
      created_at: new Date().toISOString()
    }

    const { error } = await supabase.from('leads').insert([leadToInsert])

    if (!error) {
      setShowModal(false)
      setNewLead({ name: '', email: '', phone: '', company: '', source: 'WhatsApp', stage: 'Nuevo', score: 0, value: '' })
      fetchLeads()
    } else {
      console.error('Error adding lead:', error)
    }
    setIsAddingLead(false)
  }

  const handleUpdateLead = async (id, updates) => {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
    
    if (!error) fetchLeads()
  }

  const exportLeads = () => {
    const headers = ['Nombre,Compañia,Email,Telefono,Origen,Estado,Score,Valor']
    const rows = leads.map(l => 
        `"${l.name}","${l.company}","${l.email}","${l.phone}","${l.source}","${l.stage}",${l.score},"${l.value}"`
    )
    const csvString = headers.concat(rows).join("\n")
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "nexus_leads.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page-content" style={{ padding: '32px' }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Leads Management</h1>
            <p className="page-subtitle">Track and nurture your sales opportunities</p>
          </div>
          <div className="flex gap-3">
             <button className="btn btn-secondary" onClick={exportLeads}><Download size={18} /> Export</button>
             <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Create Lead</button>
          </div>
        </div>
      </div>

      <div className="filters-bar" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderRadius: 16, marginBottom: 24, border: '1px solid var(--glass-border)' }}>
        <div className="header-search" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={18} />
          <input 
            type="text" placeholder="Search by name, company or email..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           {['All Status', 'Source', 'Priority', 'Assigned'].map(f => (
             <button key={f} className="btn btn-ghost btn-sm" style={{ fontSize: '0.85rem' }}>{f} <ChevronDown size={14} /></button>
           ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
           <thead>
             <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>LEAD INFO</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>SOURCE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>STAGE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>SCORE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>DEAL VALUE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>ACTIONS</th>
             </tr>
           </thead>
           <tbody>
             {isLoading ? (
               <tr>
                 <td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>
                   <div className="spinner" style={{ margin: '0 auto 12px' }} />
                   <p style={{ color: 'var(--text-tertiary)' }}>Fetching your real leads from Naturel...</p>
                 </td>
               </tr>
             ) : leads.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
               <tr>
                 <td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-tertiary)' }}>No leads found.</p>
                 </td>
               </tr>
             ) : (
               leads
                 .filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                 .map((l, i) => (
                   <tr key={l.id} className="table-row-hover" style={{ borderBottom: i === leads.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                     <td style={{ padding: '24px' }}>
                        <div className="flex items-center gap-4">
                           <div className="avatar md" style={{ background: 'linear-gradient(135deg, #6366f1, #a5b4fc)' }}>{l.name?.substring(0,2).toUpperCase()}</div>
                           <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{l.company} • {l.email}</div>
                           </div>
                        </div>
                     </td>
                     <td><span className={`badge ${getSourceBadge(l.source)}`}>{l.source}</span></td>
                     <td>
                        <select 
                            className="badge-select"
                            value={l.stage} 
                            onChange={(e) => handleUpdateLead(l.id, { stage: e.target.value })}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                fontWeight: 700
                            }}
                        >
                            {['Nuevo', 'Contactado', 'Interesado', 'Negociación', 'Venta Cerrada', 'Venta Perdida'].map(s => (
                                <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
                            ))}
                        </select>
                      </td>
                      <td><ScoreBadge score={l.score} onScoreChange={(newScore) => handleUpdateLead(l.id, { score: newScore })} /></td>
                     <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{l.value || '$0'}</td>
                     <td>
                        <div className="flex gap-2">
                           <button className="btn btn-ghost btn-sm" title="Send Email"><Mail size={16} /></button>
                           <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                        </div>
                     </td>
                   </tr>
                 ))
             )}
           </tbody>
        </table>
      </div>
      
      {/* Lead Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Create New Lead</h1>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLead} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Full Name</label>
                  <input 
                    type="text" required className="input" placeholder="e.g. John Doe" 
                    value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" required className="input" placeholder="john@company.com" 
                    value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input 
                    type="text" className="input" placeholder="+57..." 
                    value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Company</label>
                  <input 
                    type="text" className="input" placeholder="Organization name" 
                    value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Source</label>
                  <select className="input" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                    <option>WhatsApp</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>Formulario</option>
                    <option>Email</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Estimated Value</label>
                  <input 
                    type="text" className="input" placeholder="$0.00" 
                    value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, margin: '0 -24px -8px', paddingRight: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isAddingLead}>
                  {isAddingLead ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
