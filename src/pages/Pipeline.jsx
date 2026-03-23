import { useState } from 'react'
import {
  Plus, MoreHorizontal, DollarSign, Filter, Settings
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const pipelineStages = [
  { id: 'nuevo', title: 'Nuevo Lead', color: '#6366f1', deals: [] },
  { id: 'contactado', title: 'Contactado', color: '#06b6d4', deals: [] },
  { id: 'interesado', title: 'Interesado', color: '#8b5cf6', deals: [] },
  { id: 'negociacion', title: 'Negociación', color: '#f59e0b', deals: [] },
  { id: 'cerrada', title: 'Venta Cerrada', color: '#10b981', deals: [] },
  { id: 'perdida', title: 'Venta Perdida', color: '#f43f5e', deals: [] },
]

function getProbabilityColor(p) {
  if (p >= 80) return 'emerald'
  if (p >= 50) return 'amber'
  if (p >= 25) return 'violet'
  return 'neutral'
}

export default function Pipeline() {
  const [stages, setStages] = useState(pipelineStages)

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
      // Reordering within the same column
      const items = Array.from(stages[sInd].deals)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      const newStages = [...stages]
      newStages[sInd] = { ...stages[sInd], deals: items }
      setStages(newStages)
    } else {
      // Moving between columns
      const sourceItems = Array.from(stages[sInd].deals)
      const destItems = Array.from(stages[dInd].deals)
      const [movedItem] = sourceItems.splice(source.index, 1)
      destItems.splice(destination.index, 0, movedItem)

      const newStages = [...stages]
      newStages[sInd] = { ...stages[sInd], deals: sourceItems }
      newStages[dInd] = { ...stages[dInd], deals: destItems }
      setStages(newStages)
    }
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
            <button className="btn btn-secondary"><Filter size={16} /> Filtros</button>
            <button className="btn btn-secondary"><Settings size={16} /> Personalizar</button>
            <button className="btn btn-primary"><Plus size={16} /> Nuevo Deal</button>
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
                      <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center', marginTop: 8, borderStyle: 'dashed', border: '1px dashed var(--border-default)' }}>
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
