import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../lib/useTenant'
import { Users, Plus, Trash2, ArrowLeft, Megaphone, CheckCircle2, Circle } from 'lucide-react'

export default function Lists() {
  const { tenant } = useTenant()
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignText, setCampaignText] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])

  useEffect(() => {
    if (tenant?.clientId) {
      fetchLists()
    }
  }, [tenant?.clientId])

  const fetchLists = async () => {
    setIsLoading(true)
    // Get lists and count of contacts
    const { data: listsData, error } = await supabase
      .from('broadcast_lists')
      .select('*, broadcast_contacts(count)')
      .eq('client_id', tenant.clientId)
      .order('created_at', { ascending: false })

    if (!error && listsData) {
      setLists(listsData)
    }
    setIsLoading(false)
  }

  const handleOpenList = async (list) => {
    setSelectedList(list)
    setIsLoading(true)
    const { data, error } = await supabase
      .from('broadcast_contacts')
      .select('*')
      .eq('list_id', list.id)
      .order('full_name', { ascending: true })

    if (!error && data) {
      setContacts(data)
    }
    setIsLoading(false)
  }

  const handleBack = () => {
    setSelectedList(null)
    setContacts([])
    setSelectedContacts([])
  }

  const toggleSelectContact = (id) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(c => c !== id))
    } else {
      setSelectedContacts([...selectedContacts, id])
    }
  }

  const handleSendCampaign = async () => {
    if (!campaignText.trim()) return
    setIsSending(true)
    
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: tenant.clientId,
          leadIds: selectedContacts, 
          campaignText: campaignText,
          templateName: 'alerta_promocion',
          isListMode: true 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTimeout(() => {
          setIsSending(false)
          setShowCampaignModal(false)
          setCampaignText('')
          setSelectedContacts([])
          handleOpenList(selectedList) 
          alert(`¡Campaña enviada con éxito a la lista!\nÉxitos: ${data.stats?.successes || 0}\nFallos: ${data.stats?.failures || 0}`);
        }, 1000)
      } else {
        setIsSending(false)
        alert(`Error al enviar la campaña: ${data.error || 'Desconocido'}`);
      }
    } catch (err) {
      setIsSending(false)
      alert('Error de conexión al servidor.');
    }
  }

  return (
    <div className="fade-in">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {selectedList && (
            <button className="btn btn-ghost" onClick={handleBack} style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="page-title">{selectedList ? selectedList.name : 'Listas de Difusión'}</h1>
            <p className="page-subtitle">
              {selectedList 
                ? `Gestiona los contactos de la lista y lanza campañas.` 
                : `Organiza tus contactos en grupos para enviar campañas masivas dirigidas.`}
            </p>
          </div>
        </div>
        
        {selectedList && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCampaignModal(true)} 
            disabled={selectedContacts.length === 0}
          >
            <Megaphone size={16} /> Lanzar Campaña ({selectedContacts.length})
          </button>
        )}
      </header>

      {/* VISTA DE LISTAS (TARJETAS) */}
      {!selectedList && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {isLoading ? <p>Cargando listas...</p> : lists.map(list => (
            <div 
              key={list.id} 
              className="card glass-panel" 
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '1.5rem' }}
              onClick={() => handleOpenList(list)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(155,81,224,0.1)', borderRadius: '12px', color: 'var(--primary-500)' }}>
                  <Users size={24} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{list.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {list.broadcast_contacts?.[0]?.count || 0} contactos
              </p>
            </div>
          ))}
          
          <div 
            className="card glass-panel" 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px dashed var(--border-light)',
              background: 'transparent'
            }}
            onClick={() => alert("Crear nueva lista manualmente próximamente")}
          >
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <Plus size={24} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Crear nueva lista</p>
          </div>
        </div>
      )}

      {/* VISTA DE CONTACTOS EN LA LISTA */}
      {selectedList && (
        <div className="card glass-panel" style={{ marginTop: '2rem' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40, cursor: 'pointer' }} onClick={() => {
                    if (selectedContacts.length === contacts.length && contacts.length > 0) setSelectedContacts([])
                    else setSelectedContacts(contacts.map(c => c.id))
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', transition: 'all 0.2s ease', color: selectedContacts.length === contacts.length && contacts.length > 0 ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>
                      {selectedContacts.length === contacts.length && contacts.length > 0 ? (
                        <CheckCircle2 size={20} fill="currentColor" color="var(--bg-primary)" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </div>
                  </th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Cargando contactos...</td></tr>
                ) : contacts.map(contact => (
                  <tr 
                    key={contact.id} 
                    className={selectedContacts.includes(contact.id) ? 'active' : ''}
                    onClick={() => toggleSelectContact(contact.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', transition: 'all 0.2s ease', color: selectedContacts.includes(contact.id) ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>
                        {selectedContacts.includes(contact.id) ? (
                          <CheckCircle2 size={20} fill="currentColor" color="var(--bg-primary)" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{contact.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{contact.phone}</td>
                    <td>
                      <span className={`status-badge ${contact.status === 'messaged' ? 'status-won' : 'status-new'}`}>
                        {contact.status === 'messaged' ? 'Contactado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && !isLoading && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay contactos en esta lista.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAMPAIGN MODAL */}
      {showCampaignModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Lanzar Campaña (Plantilla)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Se enviará la plantilla <strong>alerta_promocion</strong> a {selectedContacts.length} contactos de la lista "{selectedList?.name}".
            </p>
            
            <div className="form-group">
              <label className="form-label">Texto de la variable {'{{1}}'}</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="Ej: Tenemos 20% de descuento en todos los morrales hoy."
                value={campaignText}
                onChange={(e) => setCampaignText(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowCampaignModal(false)} disabled={isSending}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSendCampaign} disabled={isSending || !campaignText.trim()}>
                {isSending ? 'Enviando...' : 'Enviar a Meta API'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
