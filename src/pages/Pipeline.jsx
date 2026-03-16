import { useState } from 'react'
import {
  Plus, MoreHorizontal, DollarSign, Filter, Settings
} from 'lucide-react'

const pipelineStages = [
  {
    id: 'nuevo',
    title: 'Nuevo Lead',
    color: '#6366f1',
    deals: [
      { id: 1, title: 'Software CRM para Retail', company: 'Retail Co', value: '$12,000', probability: 25, assigned: { avatar: 'AR', bg: '#ec4899' }, days: 2 },
      { id: 2, title: 'Implementación ERP', company: 'LogisTech', value: '$45,000', probability: 15, assigned: { avatar: 'MT', bg: '#6366f1' }, days: 1 },
      { id: 3, title: 'Consultoría Digital', company: 'StartUp IO', value: '$8,500', probability: 20, assigned: { avatar: 'LM', bg: '#06b6d4' }, days: 3 },
    ]
  },
  {
    id: 'contactado',
    title: 'Contactado',
    color: '#06b6d4',
    deals: [
      { id: 4, title: 'Plataforma E-commerce', company: 'Fashion Plus', value: '$28,000', probability: 40, assigned: { avatar: 'DS', bg: '#f59e0b' }, days: 5 },
      { id: 5, title: 'App Mobile B2B', company: 'Industrial SA', value: '$35,000', probability: 35, assigned: { avatar: 'AR', bg: '#ec4899' }, days: 4 },
    ]
  },
  {
    id: 'interesado',
    title: 'Interesado',
    color: '#8b5cf6',
    deals: [
      { id: 6, title: 'Suite de Analytics', company: 'Data Corp', value: '$52,000', probability: 60, assigned: { avatar: 'MT', bg: '#6366f1' }, days: 8 },
      { id: 7, title: 'Chatbot IA', company: 'TechCorp SA', value: '$18,500', probability: 55, assigned: { avatar: 'LM', bg: '#06b6d4' }, days: 7 },
      { id: 8, title: 'Integración API', company: 'Global Net', value: '$22,000', probability: 50, assigned: { avatar: 'DS', bg: '#f59e0b' }, days: 6 },
    ]
  },
  {
    id: 'negociacion',
    title: 'Negociación',
    color: '#f59e0b',
    deals: [
      { id: 9, title: 'Plan Enterprise', company: 'TechCorp SA', value: '$62,500', probability: 75, assigned: { avatar: 'AR', bg: '#ec4899' }, days: 12 },
      { id: 10, title: 'Migración Cloud', company: 'CloudsDev', value: '$48,000', probability: 80, assigned: { avatar: 'MT', bg: '#6366f1' }, days: 10 },
    ]
  },
  {
    id: 'cerrada',
    title: 'Venta Cerrada',
    color: '#10b981',
    deals: [
      { id: 11, title: 'CRM Profesional', company: 'Digital Co', value: '$15,800', probability: 100, assigned: { avatar: 'LM', bg: '#06b6d4' }, days: 18 },
      { id: 12, title: 'Pack Starter Anual', company: 'Media Plus', value: '$9,200', probability: 100, assigned: { avatar: 'DS', bg: '#f59e0b' }, days: 15 },
    ]
  },
  {
    id: 'perdida',
    title: 'Venta Perdida',
    color: '#f43f5e',
    deals: [
      { id: 13, title: 'Solución On-premise', company: 'OldTech SL', value: '$32,000', probability: 0, assigned: { avatar: 'AR', bg: '#ec4899' }, days: 20 },
    ]
  },
]

function getProbabilityColor(p) {
  if (p >= 80) return 'emerald'
  if (p >= 50) return 'amber'
  if (p >= 25) return 'violet'
  return 'neutral'
}

export default function Pipeline() {
  const [draggedCard, setDraggedCard] = useState(null)

  const totalValue = pipelineStages.reduce((acc, stage) =>
    acc + stage.deals.reduce((s, d) => s + parseInt(d.value.replace(/[$,]/g, '')), 0), 0
  )

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

      <div className="pipeline-container animate-slideUp stagger-1" style={{ flex: 1 }}>
        {pipelineStages.map(stage => {
          const stageTotal = stage.deals.reduce((s, d) => s + parseInt(d.value.replace(/[$,]/g, '')), 0)
          return (
            <div key={stage.id} className="pipeline-column">
              <div className="pipeline-column-header">
                <div className="pipeline-column-title">
                  <div className="dot" style={{ background: stage.color }} />
                  <h3>{stage.title}</h3>
                  <span className="count">{stage.deals.length}</span>
                </div>
                <span className="pipeline-column-total">${stageTotal.toLocaleString()}</span>
              </div>
              <div className="pipeline-cards">
                {stage.deals.map(deal => (
                  <div
                    key={deal.id}
                    className="pipeline-card"
                    draggable
                    onDragStart={() => setDraggedCard(deal.id)}
                    onDragEnd={() => setDraggedCard(null)}
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
                ))}
                <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center', marginTop: 4, borderStyle: 'dashed', border: '1px dashed var(--border-default)' }}>
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
