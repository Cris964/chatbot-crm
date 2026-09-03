import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/apiFetch'
import { useTenant } from '../lib/useTenant'
import {
  Users, Search, Filter, Mail, Phone, Calendar, 
  MessageSquare, Send, MoreHorizontal, Download, 
  Plus, CheckCircle2, AlertCircle, Clock, Megaphone,
  Circle
} from 'lucide-react'

export default function Remarketing() {
  const { session } = useOutletContext()
  const tenant = useTenant()
  
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState([])
  const [stageFilter, setStageFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  
  // Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [templateToSend, setTemplateToSend] = useState('iniciacion')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
      fetchRemarketingLeads()
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchRemarketingLeads = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', tenant.clientId)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      const mapped = data.map(l => ({
        ...l,
        full_name: l.name || 'Sin Nombre',
        last_purchase_date: l.updated_at || l.created_at || new Date().toISOString(),
        status: l.status === 'messaged' ? 'messaged' : 'pending' // En caso de que se use para tracking
      }))
      setLeads(mapped)
    }
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
    
    try {
      const response = await apiFetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: tenant.clientId,
          leadIds: selectedLeads,
          campaignText: templateToSend,
          templateName: templateToSend
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Success
        console.log("Broadcast success:", data);
        setTimeout(() => {
          setIsSending(false)
          setShowCampaignModal(false)
          setCampaignText('')
          setSelectedLeads([])
          fetchRemarketingLeads()
          alert(`¡Campaña enviada con éxito!\nÉxitos: ${data.stats?.successes || 0}\nFallos: ${data.stats?.failures || 0}`);
        }, 1000)
      } else {
        setIsSending(false)
        alert(`Error al enviar la campaña: ${data.error || 'Desconocido'}`);
      }
    } catch (err) {
      setIsSending(false)
      alert('Error de conexión al servidor.');
      console.error(err);
    }
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.phone && l.phone.includes(searchQuery))
    const matchesStage = stageFilter === 'All' || l.stage === stageFilter
    const matchesSource = sourceFilter === 'All' || l.source === sourceFilter
    return matchesSearch && matchesStage && matchesSource
  })

  const handleExport = () => {
    if (filteredLeads.length === 0) return;
    
    // Create CSV content
    const headers = ['Nombre', 'Telefono', 'Etapa', 'Origen', 'Ultima Actividad', 'Dias Inactivo'];
    const rows = filteredLeads.map(lead => {
      const diffDays = Math.floor((new Date() - new Date(lead.last_purchase_date)) / (1000 * 60 * 60 * 24));
      return [
        `"${lead.full_name}"`,
        `"${lead.phone || ''}"`,
        `"${lead.stage || 'N/A'}"`,
        `"${lead.source || 'N/A'}"`,
        `"${new Date(lead.last_purchase_date).toLocaleDateString()}"`,
        diffDays
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Remarketing_Leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content" style={{ padding: 32 }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Re-marketing</h1>
            <p className="page-subtitle">Contacta a clientes antiguos para reactivar ventas — {tenant.clientName}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={handleExport} disabled={filteredLeads.length === 0}>
              <Download size={16} /> Descargar DATA
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
            Estos clientes no han realizado compras en los últimos <strong style={{ color: "var(--text-primary)" }}>6 meses</strong>. 
            Selecciona a quiénes deseas que <strong style={{ color: 'var(--primary-400)' }}>Cami</strong> contacte hoy.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            className="form-input" 
            placeholder="Buscar por nombre o teléfono..." 
            style={{ paddingLeft: 40 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="form-input" 
          style={{ width: 'auto', background: 'rgba(var(--overlay-rgb), 0.02)' }}
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="All">Todas las Etapas</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Contactado">Contactado</option>
          <option value="Interesado">Interesado</option>
          <option value="Negociación">Negociación</option>
          <option value="Venta Cerrada">Venta Cerrada</option>
          <option value="Venta Perdida">Venta Perdida</option>
        </select>

        <select 
          className="form-input" 
          style={{ width: 'auto', background: 'rgba(var(--overlay-rgb), 0.02)' }}
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
        >
          <option value="All">Todos los Orígenes</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Messenger">Messenger</option>
          <option value="Instagram">Instagram</option>
          <option value="Formulario">Formulario</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40, cursor: 'pointer' }} onClick={() => {
                if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) setSelectedLeads([])
                else setSelectedLeads(filteredLeads.map(l => l.id))
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', transition: 'all 0.2s ease', color: selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>
                  {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
                    <CheckCircle2 size={20} fill="currentColor" color="var(--bg-primary)" />
                  ) : (
                    <Circle size={20} />
                  )}
                </div>
              </th>
              <th>Cliente</th>
              <th>Etapa</th>
              <th>Origen</th>
              <th>Última Actividad</th>
              <th>Días Inactivo</th>
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
                <tr 
                  key={lead.id} 
                  className={selectedLeads.includes(lead.id) ? 'active' : ''}
                  onClick={() => toggleSelectLead(lead.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', transition: 'all 0.2s ease', color: selectedLeads.includes(lead.id) ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>
                      {selectedLeads.includes(lead.id) ? (
                        <CheckCircle2 size={20} fill="currentColor" color="var(--bg-primary)" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span style={{ fontWeight: 600 }}>{lead.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${lead.stage === 'Venta Cerrada' ? 'emerald' : lead.stage === 'Venta Perdida' ? 'rose' : lead.stage === 'Interesado' ? 'violet' : 'amber'}`}>
                      {lead.stage || 'Nuevo'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.source || 'N/A'}</span>
                  </td>
                  <td>{lastDate.toLocaleDateString()}</td>
                  <td>
                    <span style={{ color: diffDays > 180 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 600 }}>
                      {diffDays} días
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
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  📤 Se enviará una <strong style={{ color: 'var(--primary-400)' }}>Plantilla de WhatsApp aprobada</strong> directamente a los <strong>{selectedLeads.length}</strong> clientes seleccionados, sin restricciones de las 24 horas de Meta.
                </p>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Plantilla a Enviar</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre interno de la plantilla (ej: iniciacion)"
                  value={templateToSend}
                  onChange={e => setTemplateToSend(e.target.value)}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 6 }}>El nombre debe coincidir exactamente con la plantilla aprobada en Meta Business Manager.</p>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setShowCampaignModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSendCampaign} disabled={isSending || !templateToSend.trim()}>
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
