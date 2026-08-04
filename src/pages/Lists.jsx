import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import { Users, Plus, Trash2, ArrowLeft, Megaphone, CheckCircle2, Circle, Paperclip, Mic } from 'lucide-react'

export default function Lists() {
  const tenant = useTenant()
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignText, setCampaignText] = useState('')
  const [templateName, setTemplateName] = useState('alerta_promocion')
  const [templateLanguage, setTemplateLanguage] = useState('es')
  const [errorMsg, setErrorMsg] = useState(null)
  const [selectedContacts, setSelectedContacts] = useState([])
  const [isGlobalCampaign, setIsGlobalCampaign] = useState(false)

  // Nuevos estados para multimedia y modos de campaña
  const [campaignMode, setCampaignMode] = useState('template') // 'template' o 'free'
  const [pendingMedia, setPendingMedia] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  useEffect(() => {
    if (tenant?.clientId) {
      fetchLists()
    }
  }, [tenant?.clientId])

  const fetchLists = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const response = await fetch('/api/broadcast?action=get_lists&clientId=' + tenant.clientId)
      const data = await response.json()
      if (response.ok && data.lists) {
        setLists(data.lists)
      } else {
        setErrorMsg(data.error || 'Unknown error fetching lists')
      }
    } catch (err) {
      console.error('Error fetching lists:', err)
      setErrorMsg(err.message)
    }
    setIsLoading(false)
  }

  const handleOpenList = async (list) => {
    setSelectedList(list)
    setIsLoading(true)
    try {
      const response = await fetch('/api/broadcast?action=get_contacts&listId=' + list.id)
      const data = await response.json()
      if (response.ok && data.contacts) {
        setContacts(data.contacts)
      }
    } catch (err) {
      console.error('Error fetching contacts:', err)
    }
    setIsLoading(false)
  }

  const handleBack = () => {
    setSelectedList(null)
    setContacts([])
    setSelectedContacts([])
    setIsGlobalCampaign(false)
  }

  const toggleSelectContact = (id) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(c => c !== id))
    } else {
      setSelectedContacts([...selectedContacts, id])
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        setPendingMedia({ blob: audioBlob, type: 'audio/ogg', name: `voice_${Date.now()}.ogg`, isAudio: true })
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      alert('Para grabar audios, por favor permite el acceso al micrófono en tu navegador.')
    }
  }

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
        }
      }
      mediaRecorderRef.current.stop()
      clearInterval(recordingTimerRef.current)
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const getMediaType = (mimeType, fName) => {
      if (!mimeType) mimeType = '';
      const m = mimeType.toLowerCase();
      if (m.startsWith('image/')) return 'image';
      if (m.startsWith('video/')) return 'video';
      if (m.startsWith('audio/')) return 'audio';
      
      if (fName) {
        const ext = fName.split('.').pop().toLowerCase();
        if (['jpeg','jpg','gif','png','webp'].includes(ext)) return 'image';
        if (['mp4','webm','ogg','avi','mov'].includes(ext)) return 'video';
        if (['mp3','wav','oga','aac','m4a','amr'].includes(ext)) return 'audio';
      }
      return 'document';
    };
    
    setPendingMedia({
      blob: file,
      type: file.type || 'application/octet-stream',
      name: file.name,
      mediaType: getMediaType(file.type, file.name)
    })
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendCampaign = async () => {
    if (!campaignText.trim() && !pendingMedia) return
    setIsSending(true)
    
    try {
      let mediaUrl = null;
      let finalMediaType = null;
      
      if (pendingMedia) {
        const fileName = `${Date.now()}_${pendingMedia.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { data, error } = await supabase.storage
          .from('whatsapp_media')
          .upload(fileName, pendingMedia.blob, { contentType: pendingMedia.type })
          
        if (error) throw new Error(error.message);
        
        const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
        mediaUrl = publicUrlData.publicUrl;
        finalMediaType = pendingMedia.isAudio ? 'audio' : pendingMedia.mediaType;
      }

      if (isGlobalCampaign) {
         const { data: allContacts, error: contactErr } = await supabase
           .from('broadcast_contacts')
           .select('id, list_id')
           .eq('client_id', tenant.clientId);
           
         if (contactErr) throw new Error(contactErr.message);
         
         const grouped = {};
         allContacts.forEach(c => {
            if (!grouped[c.list_id]) grouped[c.list_id] = [];
            grouped[c.list_id].push(c.id);
         });

         let globalSuccesses = 0;
         let globalFailures = 0;

         for (const lId of Object.keys(grouped)) {
            const lContacts = grouped[lId];
            for (let i = 0; i < lContacts.length; i += 50) {
               const chunk = lContacts.slice(i, i + 50);
               const res = await fetch('/api/broadcast', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   clientId: tenant.clientId,
                   leadIds: chunk,
                   campaignText: campaignText,
                   templateName: templateName.trim() || 'alerta_promocion',
                   templateLanguage: templateLanguage,
                   isListMode: true,
                   listId: lId,
                   isFreeMessage: campaignMode === 'free',
                   mediaUrl,
                   mediaType: finalMediaType
                 })
               });
               const data = await res.json();
               globalSuccesses += data.stats?.successes || 0;
               globalFailures += data.stats?.failures || 0;
               if (data.firstError) window.lastGlobalError = data.firstError;
            }
         }
         
         setTimeout(() => {
           setIsSending(false)
           setShowCampaignModal(false)
           setCampaignText('')
           setPendingMedia(null)
           setIsGlobalCampaign(false)
           alert(`¡Campaña Global enviada a todas las listas!\nÉxitos: ${globalSuccesses}\nFallos: ${globalFailures}` + (globalFailures > 0 && window.lastGlobalError ? `\nError: ${JSON.stringify(window.lastGlobalError)}` : ""));
         }, 1000);
         
      } else {
        const response = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: tenant.clientId,
            leadIds: selectedContacts, 
            campaignText: campaignText,
            templateName: templateName.trim() || 'alerta_promocion',
            templateLanguage: templateLanguage,
            isListMode: true,
            listId: selectedList?.id,
            isFreeMessage: campaignMode === 'free',
            mediaUrl,
            mediaType: finalMediaType
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setTimeout(() => {
            setIsSending(false)
            setShowCampaignModal(false)
            setCampaignText('')
            setSelectedContacts([])
            setPendingMedia(null)
            handleOpenList(selectedList) 
            alert(`¡Campaña enviada con éxito a la lista!\nÉxitos: ${data.stats?.successes || 0}\nFallos: ${data.stats?.failures || 0}`);
          }, 1000)
        } else {
          setIsSending(false)
          alert(`Error al enviar la campaña: ${data.error || 'Desconocido'}`);
        }
      }
    } catch (err) {
      console.error(err)
      setIsSending(false)
      alert('Error: ' + err.message);
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
        <div style={{ marginTop: '2rem' }}>
          {errorMsg && (
            <div style={{ padding: '1rem', background: 'rgba(255, 59, 48, 0.1)', color: 'var(--accent-rose)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255, 59, 48, 0.2)' }}>
              Error: {errorMsg}
              <button className="btn btn-secondary btn-sm" style={{ marginLeft: '1rem' }} onClick={fetchLists}>Reintentar</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
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
              background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.2))',
              border: '1px solid var(--primary-500)',
              color: 'var(--primary-500)'
            }}
            onClick={() => { setIsGlobalCampaign(true); setShowCampaignModal(true); }}
          >
            <div style={{ padding: '1rem', background: 'var(--primary-500)', borderRadius: '50%', marginBottom: '1rem', color: '#fff' }}>
              <Megaphone size={24} />
            </div>
            <p style={{ fontWeight: '600' }}>Enviar a Todas las Listas</p>
          </div>

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
          <div className="card glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Lanzar Campaña</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px' }}>
              <button 
                type="button"
                className={`btn ${campaignMode === 'template' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1 }} 
                onClick={() => setCampaignMode('template')}
              >
                Plantilla Oficial
              </button>
              <button 
                type="button"
                className={`btn ${campaignMode === 'free' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1 }}
                onClick={() => setCampaignMode('free')}
              >
                Mensaje Libre
              </button>
            </div>

            {campaignMode === 'template' ? (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong>Modo Plantilla:</strong> Escribe el nombre exacto de la plantilla aprobada en Meta. Ideal para contactar masivamente (Re-marketing). Si adjuntas multimedia, tu plantilla debe soportarlo en Meta.
              </div>
            ) : (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong>Modo Libre:</strong> Envía texto, fotos o audios libremente. <strong>⚠️ Solo llegará a los clientes que te hayan escrito en las últimas 24 horas.</strong>
              </div>
            )}

              {campaignMode === 'template' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nombre de la Plantilla en Meta</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: nueva_linea"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Idioma</label>
                    <select className="form-input" value={templateLanguage} onChange={(e) => setTemplateLanguage(e.target.value)}>
                      <option value="es">Español (es)</option>
                      <option value="es_CO">Español Colombia (es_CO)</option>
                      <option value="es_LA">Español Latino (es_LA)</option>
                      <option value="en_US">Inglés (en_US)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {campaignMode === 'template' 
                    ? 'Variables de la Plantilla ({{1}}, {{2}}...)'
                    : 'Texto del Mensaje (Formato libre)'}
                </label>
                {campaignMode === 'template' && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: '-0.25rem' }}>
                    Cada línea que escribas será una variable en el orden de la plantilla. Por ejemplo, la primera línea es {"{{1}}"}, la segunda {"{{2}}"}, etc.
                  </p>
                )}
                <textarea 
                  className="form-input" 
                  rows="6" 
                  placeholder={campaignMode === 'template' ? "MEDIANO\nJM325M\n$40.000\n6 meses de garantía" : "Escribe tu mensaje libre aquí..."}
                  value={campaignText}
                  onChange={(e) => setCampaignText(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
            
            {/* Adjuntos */}
            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
              {pendingMedia ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {pendingMedia.isAudio ? <Mic size={20} className="text-primary-500" /> : <Paperclip size={20} className="text-primary-500" />}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingMedia.name}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPendingMedia(null)}><Trash2 size={16} className="text-danger" /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {!isRecording ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip size={16} /> Adjuntar
                      </button>
                      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*,application/pdf" />
                      
                      <button className="btn btn-secondary btn-sm" onClick={startRecording}>
                        <Mic size={16} /> Audio
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></div>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                          {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => stopRecording(true)}><Trash2 size={18} /></button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => stopRecording(false)} style={{ background: '#ef4444' }}>Guardar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={() => { setShowCampaignModal(false); setPendingMedia(null); stopRecording(true); setIsGlobalCampaign(false); }} disabled={isSending}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSendCampaign} disabled={isSending || (!campaignText.trim() && !pendingMedia)}>
                {isSending ? 'Enviando...' : (isGlobalCampaign ? 'Lanzar a Todas las Listas' : `Lanzar a ${selectedContacts.length} contactos`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
