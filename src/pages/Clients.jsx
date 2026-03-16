import {
  Search, Filter, Plus, Mail, Phone, MapPin, Calendar,
  MoreHorizontal, ExternalLink, DollarSign, ShoppingBag,
  MessageSquare, Star, Building, ChevronDown
} from 'lucide-react'

const clients = [
  { id: 1, name: 'María González', email: 'maria@techcorp.com', phone: '+57 301 234 5678', company: 'TechCorp SA', location: 'Bogotá, Colombia', avatar: 'MG', bg: 'linear-gradient(135deg, #10b981, #06b6d4)', since: 'Ene 2025', ltv: '$125,400', purchases: 8, lastContact: 'Hoy', status: 'Activo', tags: ['Enterprise', 'VIP'] },
  { id: 2, name: 'Juan Pérez', email: 'juan@startup.io', phone: '+57 315 876 5432', company: 'StartUp IO', location: 'Medellín, Colombia', avatar: 'JP', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', since: 'Mar 2025', ltv: '$48,200', purchases: 4, lastContact: 'Ayer', status: 'Activo', tags: ['Profesional'] },
  { id: 3, name: 'Ana Rodríguez', email: 'ana@digital.co', phone: '+57 320 111 2233', company: 'Digital Co', location: 'Cali, Colombia', avatar: 'AR', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)', since: 'Jun 2025', ltv: '$32,100', purchases: 3, lastContact: 'Hace 3 días', status: 'Activo', tags: ['Starter'] },
  { id: 4, name: 'Carlos Medina', email: 'carlos@global.net', phone: '+57 310 444 5566', company: 'Global Net', location: 'Barranquilla, Colombia', avatar: 'CM', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', since: 'Sep 2025', ltv: '$78,500', purchases: 6, lastContact: 'Hace 5 días', status: 'Activo', tags: ['Enterprise'] },
  { id: 5, name: 'Laura Sánchez', email: 'laura@media.com', phone: '+57 318 777 8899', company: 'Media Plus', location: 'Bogotá, Colombia', avatar: 'LS', bg: 'linear-gradient(135deg, #8b5cf6, #6366f1)', since: 'Nov 2025', ltv: '$18,400', purchases: 2, lastContact: 'Hace 1 semana', status: 'Inactivo', tags: ['Starter'] },
  { id: 6, name: 'Roberto Díaz', email: 'roberto@clouds.dev', phone: '+57 300 222 3344', company: 'CloudsDev', location: 'Bucaramanga, Colombia', avatar: 'RD', bg: 'linear-gradient(135deg, #06b6d4, #10b981)', since: 'Feb 2025', ltv: '$95,000', purchases: 7, lastContact: 'Hoy', status: 'Activo', tags: ['Enterprise', 'VIP'] },
]

const purchases = [
  { id: 1, product: 'Plan Enterprise Anual', date: 'Mar 5, 2026', amount: '$24,000', status: 'Pagado' },
  { id: 2, product: 'Módulo IA Premium', date: 'Feb 12, 2026', amount: '$4,800', status: 'Pagado' },
  { id: 3, product: 'Integración API WhatsApp', date: 'Ene 20, 2026', amount: '$2,400', status: 'Pagado' },
  { id: 4, product: 'Soporte Dedicado Q1', date: 'Ene 5, 2026', amount: '$6,000', status: 'Pendiente' },
]

export default function Clients() {
  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">Directorio completo de clientes con historial y métricas</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary"><Filter size={16} /> Filtros</button>
            <button className="btn btn-primary"><Plus size={16} /> Nuevo Cliente</button>
          </div>
        </div>
      </div>

      <div className="filters-bar animate-slideUp stagger-1">
        <div className="header-search" style={{ maxWidth: 280 }}>
          <Search />
          <input type="text" placeholder="Buscar clientes..." />
        </div>
        <button className="filter-btn">Estado <ChevronDown size={13} /></button>
        <button className="filter-btn">Etiqueta <ChevronDown size={13} /></button>
        <button className="filter-btn">LTV <ChevronDown size={13} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Client Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clients.map((client, i) => (
            <div key={client.id} className={`card animate-slideUp stagger-${Math.min(i + 1, 6)}`} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div className="avatar lg" style={{ background: client.bg }}>{client.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{client.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        <Building size={14} /> {client.company}
                      </div>
                    </div>
                    <span className={`badge ${client.status === 'Activo' ? 'emerald' : 'neutral'}`}>{client.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                      <Mail size={14} /> {client.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                      <MapPin size={14} /> {client.location}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>VALOR TOTAL</div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{client.ltv}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>COMPRAS</div>
                      <div style={{ fontWeight: 700 }}>{client.purchases}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>CLIENTE DESDE</div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{client.since}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>ÚLTIMO CONTACTO</div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{client.lastContact}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    {client.tags.map((tag, i) => (
                      <span key={i} className="badge purple">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Client Detail / Purchase History */}
        <div>
          <div className="card animate-slideUp stagger-2" style={{ position: 'sticky', top: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Detalle del Cliente</h3>
              <button className="btn btn-ghost btn-sm"><ExternalLink size={16} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="avatar xl" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', margin: '0 auto 10px' }}>MG</div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>María González</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>TechCorp SA • Bogotá, Colombia</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                <DollarSign size={20} style={{ color: 'var(--accent-emerald)', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>$125,400</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Valor Total</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                <ShoppingBag size={20} style={{ color: 'var(--primary-400)', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>8</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Compras</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                <MessageSquare size={20} style={{ color: 'var(--accent-cyan)', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>24</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Conversaciones</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 14 }}>
                <Star size={20} style={{ color: 'var(--accent-amber)', margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>VIP</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Categoría</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>Historial de Compras</h4>
              {purchases.map(purchase => (
                <div key={purchase.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border-default)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{purchase.product}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{purchase.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{purchase.amount}</div>
                    <span className={`badge ${purchase.status === 'Pagado' ? 'emerald' : 'amber'}`} style={{ fontSize: '0.68rem' }}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }}><MessageSquare size={14} /> Enviar mensaje</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Phone size={14} /> Llamar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
