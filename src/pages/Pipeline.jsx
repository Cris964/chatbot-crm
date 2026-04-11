import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, MoreHorizontal, DollarSign, Filter, Settings, Search, X
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'

const initialStages = [
  { id: 'Nuevo', title: 'Nuevo Lead', color: '#6366f1', deals: [] },
  { id: 'Contactado', title: 'Contactado', color: '#06b6d4', deals: [] },
  { id: 'Interesado', title: 'Interesado', color: '#8b5cf6', deals: [] },
  { id: 'Negociación', title: 'Negociación', color: '#f59e0b', deals: [] },
  { id: 'Venta Cerrada', title: 'Ganado', color: '#10b981', deals: [] },
  { id: 'Venta Perdida', title: 'Perdido', color: '#f43f5e', deals: [] },
]

function getProbabilityColor(p) {
  if (p >= 80) return 'emerald'
  if (p >= 50) return 'amber'
  if (p >= 25) return 'violet'
  return 'neutral'
}

export default function Pipeline() {
  const { session } = useOutletContext()
  const [stages, setStages] = useState(initialStages)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newDeal, setNewDeal] = useState({ name: '', company: '', value: '', stage: 'Nuevo' })

  useEffect(() => {
    if (session?.user?.id) {
       fetchLeads()
    }
  }, [session])

  const fetchLeads = async () => {
    setIsLoading(true)
    
    // 1. Get client IDs for multitenancy
    const { data: clients } = await supabase.from('clients').select('id').eq('user_id', session.user.id)
    const clientIds = clients?.map(c => c.id) || []

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .in('client_id', clientIds)
    
    if (!error && leads) {
      const newStages = initialStages.map(stage => ({
        ...stage,
        deals: leads
          .filter(l => l.stage === stage.id || (stage.id === 'Nuevo' && !l.stage))
          .map(l => ({
            id: l.id,
            title: l.name,
            company: l.company || 'Sin Empresa',
            value: l.value || '$0',
            probability: l.score || 50,
            days: Math.floor((new Date() - new Date(l.created_at)) / (1000 * 60 * 60 * 24)),
            assigned: { avatar: l.name.substring(0,2).toUpperCase(), bg: '#6366f1' }
          }))
      }))
      setStages(newStages)
    }
    setIsLoading(false)
  }

  const totalValue = stages.reduce((acc, stage) =>
    acc + stage.deals.reduce((s, d) => s + parseInt(d.value.replace(/[$,]/g, '')), 0), 0
  )

  const onDragEnd = (result) => {
    const { source, destination } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    const sInd = stages.findIndex(s => s.id === source.droppableId)
    const dInd = stages.findIndex(s => s.id === destination.droppableId)

    if (sInd === dInd) {
      // Reordering locally
      const items = Array.from(stages[sInd].deals)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      const newStages = [...stages]
      newStages[sInd] = { ...stages[sInd], deals: items }
      setStages(newStages)
    } else {
      // Persist change to Supabase
      const movedItem = stages[sInd].deals[source.index]
      const newStageId = destination.droppableId
      
      updateLeadStage(movedItem.id, newStageId)

      // Optimistic UI update
      const sourceItems = Array.from(stages[sInd].deals)
      const destItems = Array.from(stages[dInd].deals)
      const [item] = sourceItems.splice(source.index, 1)
      destItems.splice(destination.index, 0, item)

      const newStages = [...stages]
      newStages[sInd] = { ...stages[sInd], deals: sourceItems }
      newStages[dInd] = { ...stages[dInd], deals: destItems }
      setStages(newStages)
    }
  }

  const updateLeadStage = async (leadId, stageId) => {
     await supabase
       .from('leads')
       .update({ stage: stageId })
       .eq('id', leadId)
  }

  const handleCreateDeal = async (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    
    // Get client for multitenancy
    const { data: client } = await supabase.from('clients').select('id').eq('user_id', session.user.id).single()
    
    if (!client) {
        alert('No se encontró un cliente asociado a tu cuenta.')
        setIsSaving(false)
        return
    }

    const { error } = await supabase.from('leads').insert({
      client_id: client.id,
      name: newDeal.name,
      company: newDeal.company,
      value: newDeal.value.startsWith('$') ? newDeal.value : `$${newDeal.value}`,
      stage: newDeal.stage,
      score: 50,
      status: 'active'
    })

    if (!error) {
      setShowModal(false)
      setNewDeal({ name: '', company: '', value: '', stage: 'Nuevo' })
      fetchLeads()
    } else {
      alert('Error: ' + error.message)
    }
    setIsSaving(false)
  }
  return (
    <div className="page-content" style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))' }}>
      <div className="page-header animate-slideUp" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Pipeline de Ventas</h1>
            <p className="page-subtitle">Valor total del pipeline: <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>${totalValue.toLocaleString()}</span></p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => alert('Filtros avanzados próximamente')}><Filter size={16} /> Filtros</button>
            <button className="btn btn-secondary" onClick={() => alert('Personalización de columnas próximamente')}><Settings size={16} /> Personalizar</button>
            <button className="btn btn-primary" onClick={() => { setNewDeal({ ...newDeal, stage: 'Nuevo' }); setShowModal(true); }}>
              <Plus size={16} /> Nuevo Deal
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="pipeline-container animate-slideUp stagger-1" style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 16, padding: '0 24px 24px' }}>
          {stages.map(stage => {
            const stageTotal = stage.deals.reduce((s, d) => s + parseInt(d.value.replace(/[$,]/g, '')), 0)
            return (
              <div key={stage.id} className="pipeline-column" style={{ minWidth: 320, maxWidth: 320, display: 'flex', flexDirection: 'column' }}>
                <div className="pipeline-column-header">
                  <div className="pipeline-column-title">
                    <div className="dot" style={{ background: stage.color }} />
                    <h3>{stage.title}</h3>
                    <span className="count">{stage.deals.length}</span>
                  </div>
                  <span className="pipeline-column-total">${stageTotal.toLocaleString()}</span>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div 
                      className="pipeline-cards"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ 
                        flex: 1, 
                        minHeight: 150, 
                        paddingBottom: 40,
                        background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {stage.deals.map((deal, index) => (
                        <Draggable key={deal.id.toString()} draggableId={deal.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="pipeline-card"
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} scale(1.05)` : provided.draggableProps.style.transform,
                                boxShadow: snapshot.isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : undefined
                              }}
                            >
                              <div className="pipeline-card-title">{deal.title}</div>
                              <div className="pipeline-card-company">{deal.company}</div>
                              <div className="pipeline-card-value">{deal.value}</div>
                              <div className="pipeline-card-footer">
                                <div className="avatar pipeline-card-avatar" style={{ background: deal.assigned.bg }}>
                                  {deal.assigned.avatar}
                                </div>
                                <span className={`pipeline-card-probability badge ${getProbabilityColor(deal.probability)}`}>
                                  {deal.probability}%
                                </span>
                                <span className="pipeline-card-days">{deal.days}d</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <button 
                        className="btn btn-ghost btn-sm w-full" 
                        onClick={() => { setNewDeal({ ...newDeal, stage: stage.id }); setShowModal(true); }}
                        style={{ justifyContent: 'center', marginTop: 8, borderStyle: 'dashed', border: '1px dashed var(--border-default)' }}
                      >
                        <Plus size={14} /> Agregar
                      </button>
      </DragDropContext>

      {/* New Deal Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Nuevo Deal</h1>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateDeal} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Nombre del Deal / Contacto</label>
                  <input type="text" required className="input" placeholder="ej: Juan Pérez" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Empresa</label>
                  <input type="text" className="input" placeholder="ej: Naturel Corp" value={newDeal.company} onChange={e => setNewDeal({...newDeal, company: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Valor Estimado</label>
                  <input type="text" className="input" placeholder="ej: $1,500" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Etapa Inicial</label>
                  <select className="input" value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value})}>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, margin: '0 -24px -8px', paddingRight: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Crear Deal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
