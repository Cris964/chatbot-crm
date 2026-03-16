import {
  Truck, Package, MapPin, CheckCircle, Clock, AlertCircle,
  Search, Filter, Plus, MoreHorizontal, Eye, ArrowRight,
  Calendar, Phone, ChevronDown
} from 'lucide-react'

const stats = [
  { label: 'En Preparación', value: 8, icon: Package, color: 'purple', bg: 'rgba(99, 102, 241, 0.12)' },
  { label: 'Enviados', value: 15, icon: Truck, color: 'cyan', bg: 'rgba(6, 182, 212, 0.12)' },
  { label: 'En Tránsito', value: 12, icon: MapPin, color: 'amber', bg: 'rgba(245, 158, 11, 0.12)' },
  { label: 'Entregados', value: 142, icon: CheckCircle, color: 'emerald', bg: 'rgba(16, 185, 129, 0.12)' },
]

const dispatches = [
  { id: 'DSP-2048', sale: 'INV-1042', client: 'María González', company: 'TechCorp SA', product: 'Hardware Kit Enterprise', address: 'Cra 15 #93-75, Bogotá', carrier: 'Servientrega', tracking: 'SE-2026031242', status: 'en_transito', estimated: 'Mar 16, 2026', avatar: 'MG', bg: '#10b981' },
  { id: 'DSP-2047', sale: 'INV-1041', client: 'Roberto Díaz', company: 'CloudsDev', product: 'Server Rack x2', address: 'Calle 52 #35-12, Bucaramanga', carrier: 'Coordinadora', tracking: 'CO-2026031098', status: 'enviado', estimated: 'Mar 17, 2026', avatar: 'RD', bg: '#06b6d4' },
  { id: 'DSP-2046', sale: 'INV-1040', client: 'Ana Rodríguez', company: 'Digital Co', product: 'Pack Licencias USB', address: 'Av 6N #28-45, Cali', carrier: 'Inter Rapidísimo', tracking: 'IR-2026030855', status: 'preparando', estimated: 'Mar 18, 2026', avatar: 'AR', bg: '#ec4899' },
  { id: 'DSP-2045', sale: 'INV-1039', client: 'Fernando Castro', company: 'LogisTech', product: 'ERP Starter Kit', address: 'Cra 43A #18-45, Medellín', carrier: 'Servientrega', tracking: 'SE-2026030712', status: 'entregado', estimated: 'Mar 12, 2026', confirmed: 'Mar 12, 2026', avatar: 'FC', bg: '#f59e0b' },
  { id: 'DSP-2044', sale: 'INV-1038', client: 'Laura Sánchez', company: 'Media Plus', product: 'Dispositivos IoT x5', address: 'Calle 85 #15-30, Bogotá', carrier: 'DHL', tracking: 'DHL-2026030588', status: 'entregado', estimated: 'Mar 10, 2026', confirmed: 'Mar 10, 2026', avatar: 'LS', bg: '#8b5cf6' },
  { id: 'DSP-2043', sale: 'INV-1037', client: 'Carlos Medina', company: 'Global Net', product: 'API Hardware Module', address: 'Cra 54 #72-35, Barranquilla', carrier: 'Coordinadora', tracking: 'CO-2026030321', status: 'en_transito', estimated: 'Mar 15, 2026', avatar: 'CM', bg: '#f43f5e' },
]

const statusSteps = ['preparando', 'enviado', 'en_transito', 'entregado']
const statusLabels = { preparando: 'Preparando', enviado: 'Enviado', en_transito: 'En Tránsito', entregado: 'Entregado' }
const statusColors = { preparando: 'purple', enviado: 'cyan', en_transito: 'amber', entregado: 'emerald' }

function DispatchStatusBar({ status }) {
  const currentIndex = statusSteps.indexOf(status)
  return (
    <div className="dispatch-steps">
      {statusSteps.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`dispatch-step ${i < currentIndex ? 'completed' : i === currentIndex ? 'current' : ''}`}>
            {i <= currentIndex ? <CheckCircle size={12} /> : <Clock size={12} />}
            {statusLabels[step]}
          </div>
          {i < statusSteps.length - 1 && (
            <div className={`dispatch-step-line ${i < currentIndex ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Dispatches() {
  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Despachos</h1>
            <p className="page-subtitle">Gestión y seguimiento de entregas y envíos</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary"><Filter size={16} /> Filtros</button>
            <button className="btn btn-primary"><Plus size={16} /> Nuevo Despacho</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color} animate-slideUp stagger-${i + 1}`}>
            <div className="stat-card-header">
              <span className="stat-card-label">{stat.label}</span>
              <div className={`stat-card-icon ${stat.color}`}><stat.icon size={20} /></div>
            </div>
            <div className="stat-card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="filters-bar animate-slideUp stagger-2">
        <div className="header-search" style={{ maxWidth: 280 }}>
          <Search />
          <input type="text" placeholder="Buscar despacho..." />
        </div>
        <button className="filter-btn">Estado <ChevronDown size={13} /></button>
        <button className="filter-btn">Transportadora <ChevronDown size={13} /></button>
        <button className="filter-btn">Fecha <ChevronDown size={13} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {dispatches.map((d, i) => (
          <div key={d.id} className={`card animate-slideUp stagger-${Math.min(i + 1, 6)}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div className="avatar md" style={{ background: d.bg, marginTop: 2 }}>{d.avatar}</div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontWeight: 800, color: 'var(--primary-400)' }}>{d.id}</span>
                    <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{d.sale}</span>
                    <span className={`badge ${statusColors[d.status]}`}>{statusLabels[d.status]}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                </div>

                <div className="flex items-center gap-4" style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight: 600 }}>{d.client}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{d.company}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Producto</div>
                    <span style={{ color: 'var(--text-primary)' }}>{d.product}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Transportadora</div>
                    <span style={{ color: 'var(--text-primary)' }}>{d.carrier}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Tracking</div>
                    <span style={{ color: 'var(--primary-400)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{d.tracking}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Entrega Estimada</div>
                    <span style={{ color: 'var(--text-primary)' }}>{d.estimated}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                  <MapPin size={14} /> {d.address}
                </div>

                <DispatchStatusBar status={d.status} />

                {d.confirmed && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Entrega confirmada el {d.confirmed}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
