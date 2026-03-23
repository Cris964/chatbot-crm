import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Truck, Package, MapPin, CheckCircle, Clock, AlertCircle,
  Search, Filter, Plus, MoreHorizontal, Eye, ArrowRight,
  Calendar, Phone, ChevronDown
} from 'lucide-react'

const stats = []
const dispatches = []

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
  const [searchQuery, setSearchQuery] = useState('')
  const [dispatchesList, setDispatchesList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newDispatch, setNewDispatch] = useState({
    name: '',
    sku: '',
    quantity: 1
  })

  useEffect(() => {
    fetchDispatches()
  }, [])

  const handleAddDispatch = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('inventory')
      .insert([{
        name: newDispatch.name,
        sku: newDispatch.sku,
        stock: newDispatch.quantity,
        created_at: new Date().toISOString()
      }])
    
    if (!error) {
      setShowModal(false)
      fetchDispatches()
    } else {
      alert('Error: ' + error.message)
    }
  }

  const fetchDispatches = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .limit(20)
    
    if (!error && data) {
      const mapped = data.map(d => ({
        id: `INV-${d.id}`,
        sale: d.order_id || 'N/A',
        client: d.name || 'Stock Item',
        company: 'Nexus Inventory',
        product: d.name,
        address: 'Bodega Central',
        carrier: 'Interno',
        tracking: d.sku || 'N/A',
        status: 'entregado',
        estimated: new Date(d.created_at).toLocaleDateString(),
        avatar: (d.name || 'I').substring(0,2).toUpperCase(),
        bg: '#6366f1'
      }))
      setDispatchesList(mapped)
    }
    setIsLoading(false)
  }

  const filteredDispatches = dispatchesList.filter(d => 
    d.tracking.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.product.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nuevo Despacho</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px',
            width: '100%', maxWidth: '400px', border: '1px solid var(--border-default)'
          }}>
            <h2 style={{ marginBottom: 16 }}>Nuevo Despacho</h2>
            <form onSubmit={handleAddDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>Producto</label>
                <input 
                  type="text" className="input" placeholder="Nombre del producto" required
                  value={newDispatch.name} onChange={e => setNewDispatch({...newDispatch, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>SKU / Tracking</label>
                <input 
                  type="text" className="input" placeholder="Referencia" required
                  value={newDispatch.sku} onChange={e => setNewDispatch({...newDispatch, sku: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Crear Despacho</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar por tracking, cliente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="filter-btn">Estado <ChevronDown size={13} /></button>
        <button className="filter-btn">Transportadora <ChevronDown size={13} /></button>
        <button className="filter-btn">Fecha <ChevronDown size={13} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredDispatches.map((d, i) => (
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
        {filteredDispatches.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No se encontraron despachos con "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}
