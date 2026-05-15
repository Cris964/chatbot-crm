import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import {
  Users, Search, Filter, Mail, Phone, Calendar, 
  MessageSquare, Send, MoreHorizontal, Download, 
  Plus, CheckCircle2, AlertCircle, Clock, Megaphone
} from 'lucide-react'

export default function Remarketing() {
  const { session } = useOutletContext()
  const tenant = useTenant()
  
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState([])
  
  // Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignText, setCampaignText] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
      fetchRemarketingLeads()
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchRemarketingLeads = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('remarketing_leads')
      .select('*')
      .eq('client_id', tenant.clientId)
      .order('last_purchase_date', { ascending: true })

    if (!error && data) setLeads(data)
    setIsLoading(false)
  }

  const toggleSelectLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id))
    } else {
      setSelectedLeads([...selectedLeads, id])
    }
  }

  const handleSendCampaign = async () => {
    if (!campaignText.trim()) return
    setIsSending(true)
    
    // Simulating sending via AI Agent (Cami)
    // In a real scenario, this would call an API that triggers the WhatsApp bot
    console.log(`Sending to ${selectedLeads.length} leads: ${campaignText}`)
    
    // Update status in DB
    const { error } = await supabase
      .from('remarketing_leads')
      .update({ status: 'messaged' })
      .in('id', selectedLeads)

    if (!error) {
      setTimeout(() => {
        setIsSending(false)
        setShowCampaignModal(false)
        setCampaignText('')
        setSelectedLeads([])
        fetchRemarketingLeads()
      }, 2000)
    }
  }

  const filteredLeads = leads.filter(l => 
    l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  )

  return (
    <div className="page-content" style={{ padding: 32 }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Re-marketing</h1>
            <p className="page-subtitle">Contacta a clientes antiguos para reactivar ventas — {tenant.clientName}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary">
              <Download size={16} /> Importar Base
            </button>
            <button className="btn btn-primary" onClick={() => setShowCampaignModal(true)} disabled={selectedLeads.length === 0}>
              <Megaphone size={16} /> Lanzar Campaña ({selectedLeads.length})
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 24, padding: '16px 20px' }}>
        <div className="flex items-center gap-3">
          <Clock size={20} style={{ color: 'var(--accent-amber)' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Estos clientes no han realizado compras en los últimos <strong style={{ color: 'white' }}>6 meses</strong>. 
            Selecciona a quiénes deseas que <strong style={{ color: 'var(--primary-400)' }}>Cami</strong> contacte hoy.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            className="form-input" 
            placeholder="Buscar por nombre o teléfono..." 
            style={{ paddingLeft: 40 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn"><Filter size={16} /> Filtrar por fecha</button>
      </div>

      {/* Leads Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input 
                  type="checkbox" 
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={() => {
                    if (selectedLeads.length === filteredLeads.length) setSelectedLeads([])
                    else setSelectedLeads(filteredLeads.map(l => l.id))
                  }}
                />
              </th>
              <th>Cliente</th>
              <th>Última Compra</th>
              <th>Días Inactivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>No hay leads para re-marketing en este momento.</td></tr>
            ) : filteredLeads.map(lead => {
              const lastDate = new Date(lead.last_purchase_date)
              const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24))
              
              return (
                <tr key={lead.id} className={selectedLeads.includes(lead.id) ? 'active' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                    />
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span style={{ fontWeight: 600 }}>{lead.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.phone}</span>
                    </div>
                  </td>
                  <td>{lastDate.toLocaleDateString()}</td>
                  <td>
                    <span style={{ color: diffDays > 180 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 600 }}>
                      {diffDays} días
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lead.status === 'messaged' ? 'emerald' : 'neutral'}`}>
                      {lead.status === 'messaged' ? 'Contactado' : 'Pendiente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm"><MessageSquare size={14} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>Lanzar Campaña de Re-marketing</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCampaignModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
                Instrucción para <strong style={{ color: 'var(--primary-400)' }}>Cami</strong>. Ella redactará y enviará el mensaje personalizado a cada uno de los {selectedLeads.length} clientes.
              </p>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder="Ej: Hola, diles que tenemos una nueva colección de grifería de lujo en negro mate y dales un 10% de descuento si vienen esta semana..."
                value={campaignText}
                onChange={e => setCampaignText(e.target.value)}
              />
              <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSendCampaign} disabled={isSending || !campaignText.trim()}>
                  {isSending ? 'Enviando...' : 'Iniciar Difusión'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function X({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}
