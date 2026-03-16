import { useState } from 'react'
import {
  Zap, Plus, UserPlus, Bell, Mail, Clock, Tag, GitBranch,
  ArrowRight, AlertTriangle, MessageSquare, Target,
  Repeat, CheckCircle, Star, Brain
} from 'lucide-react'

const automations = [
  {
    id: 1,
    title: 'Asignación Automática de Leads',
    description: 'Asigna nuevos leads automáticamente al vendedor con menor carga de trabajo basado en round-robin.',
    icon: UserPlus,
    iconBg: 'rgba(99, 102, 241, 0.12)',
    iconColor: '#6366f1',
    active: true,
    trigger: 'Nuevo lead creado',
    action: 'Asignar a vendedor disponible',
    runs: 847,
    lastRun: 'Hace 5 min',
    category: 'Leads'
  },
  {
    id: 2,
    title: 'Recordatorio de Seguimiento',
    description: 'Envía recordatorio al vendedor cuando un lead no ha sido contactado en más de 24 horas.',
    icon: Bell,
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#f59e0b',
    active: true,
    trigger: 'Sin contacto > 24h',
    action: 'Notificar al vendedor asignado',
    runs: 324,
    lastRun: 'Hace 15 min',
    category: 'Seguimiento'
  },
  {
    id: 3,
    title: 'Escalamiento de Chatbot',
    description: 'Detecta cuando un cliente solicita hablar con un humano y escala la conversación automáticamente.',
    icon: AlertTriangle,
    iconBg: 'rgba(244, 63, 94, 0.12)',
    iconColor: '#f43f5e',
    active: true,
    trigger: 'Intención: hablar con humano',
    action: 'Escalar a agente disponible',
    runs: 156,
    lastRun: 'Hace 2 min',
    category: 'Chatbot'
  },
  {
    id: 4,
    title: 'Detección de Intención de Compra',
    description: 'La IA analiza conversaciones en tiempo real para detectar señales de intención de compra.',
    icon: Brain,
    iconBg: 'rgba(139, 92, 246, 0.12)',
    iconColor: '#8b5cf6',
    active: true,
    trigger: 'Análisis de conversación IA',
    action: 'Alerta + mover a pipeline',
    runs: 412,
    lastRun: 'Hace 8 min',
    category: 'IA'
  },
  {
    id: 5,
    title: 'Email de Bienvenida',
    description: 'Envía un email de bienvenida personalizado a cada nuevo cliente registrado en la plataforma.',
    icon: Mail,
    iconBg: 'rgba(6, 182, 212, 0.12)',
    iconColor: '#06b6d4',
    active: true,
    trigger: 'Nuevo cliente creado',
    action: 'Enviar email template',
    runs: 1205,
    lastRun: 'Hace 1 hora',
    category: 'Email'
  },
  {
    id: 6,
    title: 'Mover Pipeline Automático',
    description: 'Mueve deals automáticamente a la siguiente etapa cuando se cumplen las condiciones configuradas.',
    icon: GitBranch,
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10b981',
    active: false,
    trigger: 'Condición cumplida',
    action: 'Avanzar etapa del deal',
    runs: 0,
    lastRun: 'Nunca',
    category: 'Pipeline'
  },
  {
    id: 7,
    title: 'Seguimiento Post-Venta',
    description: 'Programa seguimiento automático 7 días después de una venta para verificar satisfacción del cliente.',
    icon: Repeat,
    iconBg: 'rgba(236, 72, 153, 0.12)',
    iconColor: '#ec4899',
    active: true,
    trigger: '7 días post-venta',
    action: 'Enviar encuesta + notificar',
    runs: 89,
    lastRun: 'Hace 3 horas',
    category: 'Post-Venta'
  },
  {
    id: 8,
    title: 'Clasificación IA de Leads',
    description: 'Clasifica automáticamente nuevos leads por prioridad usando inteligencia artificial basada en comportamiento.',
    icon: Star,
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#f59e0b',
    active: true,
    trigger: 'Nuevo lead capturado',
    action: 'Calcular score + clasificar',
    runs: 2134,
    lastRun: 'Hace 3 min',
    category: 'IA'
  },
]

export default function Automations() {
  const [toggles, setToggles] = useState(
    automations.reduce((acc, a) => ({ ...acc, [a.id]: a.active }), {})
  )

  const toggle = (id) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Automatizaciones</h1>
            <p className="page-subtitle">Configura flujos automáticos para optimizar tu proceso comercial</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary"><Plus size={16} /> Nueva Automatización</button>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card purple animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Automatizaciones Activas</span>
            <div className="stat-card-icon purple"><Zap size={20} /></div>
          </div>
          <div className="stat-card-value">{Object.values(toggles).filter(Boolean).length}</div>
        </div>
        <div className="stat-card emerald animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Ejecuciones Hoy</span>
            <div className="stat-card-icon emerald"><CheckCircle size={20} /></div>
          </div>
          <div className="stat-card-value">1,247</div>
        </div>
        <div className="stat-card cyan animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Tiempo Ahorrado</span>
            <div className="stat-card-icon cyan"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">38h</div>
        </div>
      </div>

      <div className="automation-grid">
        {automations.map((auto, i) => (
          <div key={auto.id} className={`automation-card animate-slideUp stagger-${Math.min(i + 1, 6)}`}>
            <div className="automation-card-header">
              <div className="automation-card-icon" style={{ background: auto.iconBg, color: auto.iconColor }}>
                <auto.icon />
              </div>
              <div
                className={`toggle-switch ${toggles[auto.id] ? 'active' : ''}`}
                onClick={() => toggle(auto.id)}
              />
            </div>

            <h3>{auto.title}</h3>
            <p>{auto.description}</p>

            <div className="automation-flow">
              <span style={{ fontWeight: 600 }}>{auto.trigger}</span>
              <ArrowRight size={14} className="flow-arrow" />
              <span style={{ fontWeight: 600 }}>{auto.action}</span>
            </div>

            <div className="flex items-center justify-between mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span>{auto.runs.toLocaleString()} ejecuciones</span>
              <span>Última: {auto.lastRun}</span>
            </div>

            <div className="mt-2">
              <span className="badge neutral">{auto.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
