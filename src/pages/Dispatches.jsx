import { useState } from 'react'
import {
  Truck, Package, MapPin, Navigation, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Search, Filter, MoreHorizontal,
  Globe, Info, Phone, Calendar, ArrowUpRight, ShieldCheck,
  Zap, Compass
} from 'lucide-react'

const mockShipments = [
  {
    id: 'NX-9982',
    customer: 'Sarah Johnson',
    destination: 'San Francisco, CA',
    status: 'In Transit',
    progress: 65,
    eta: '2 days',
    driver: 'Robert Fox',
    vehicle: 'Tesla Semi #4',
    route: { from: { x: 100, y: 300, name: 'Austin' }, to: { x: 800, y: 150, name: 'SF' }, current: { x: 550, y: 200 } },
    timeline: [
      { status: 'Order Received', date: 'Mar 10, 2026', time: '09:00 AM', completed: true, icon: Package },
      { status: 'Payment Confirmed', date: 'Mar 10, 2026', time: '10:30 AM', completed: true, icon: ShieldCheck },
      { status: 'In Production', date: 'Mar 11, 2026', time: '02:15 PM', completed: true, icon: Zap },
      { status: 'Quality Check', date: 'Mar 12, 2026', time: '08:45 AM', completed: true, icon: CheckCircle2 },
      { status: 'Out for Delivery', date: 'Mar 12, 2026', time: '11:00 AM', completed: true, icon: Truck },
    ]
  },
  {
    id: 'NX-4410',
    customer: 'James Wilson',
    destination: 'Miami, FL',
    status: 'Pending',
    progress: 15,
    eta: '5 days',
    driver: 'Anner Daterson',
    vehicle: 'Ford E-Transit',
    route: { from: { x: 100, y: 150, name: 'Seattle' }, to: { x: 850, y: 350, name: 'Miami' }, current: { x: 220, y: 180 } },
    timeline: [
      { status: 'Order Received', date: 'Mar 11, 2026', time: '11:00 AM', completed: true, icon: Package },
      { status: 'Payment Confirmed', date: 'Mar 11, 2026', time: '01:30 PM', completed: true, icon: ShieldCheck },
      { status: 'In Production', date: 'Mar 12, 2026', time: '09:00 AM', completed: false, icon: Zap },
      { status: 'Quality Check', date: 'TBD', time: 'TBD', completed: false, icon: CheckCircle2 },
      { status: 'Out for Delivery', date: 'TBD', time: 'TBD', completed: false, icon: Truck },
    ]
  },
  {
    id: 'NX-2104',
    customer: 'Emily White',
    destination: 'New York, NY',
    status: 'Delivered',
    progress: 100,
    eta: 'Arrived',
    driver: 'Michael Scott',
    vehicle: 'Rivian EDV',
    route: { from: { x: 150, y: 250, name: 'LA' }, to: { x: 820, y: 120, name: 'NY' }, current: { x: 820, y: 120 } },
    timeline: [
      { status: 'Order Received', date: 'Mar 08, 2026', time: '08:00 AM', completed: true, icon: Package },
      { status: 'Payment Confirmed', date: 'Mar 08, 2026', time: '09:30 AM', completed: true, icon: ShieldCheck },
      { status: 'In Production', date: 'Mar 08, 2026', time: '03:15 PM', completed: true, icon: Zap },
      { status: 'Quality Check', date: 'Mar 09, 2026', time: '10:00 AM', completed: true, icon: CheckCircle2 },
      { status: 'Delivered', date: 'Mar 10, 2026', time: '04:00 PM', completed: true, icon: Truck },
    ]
  }
]

export default function Dispatches() {
  const [activeShipmentId, setActiveShipmentId] = useState(mockShipments[0].id)
  
  const activeShipment = mockShipments.find(s => s.id === activeShipmentId) || mockShipments[0]

  return (
    <div className="page-content" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <div className="page-header animate-slideUp" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Logística Global</h1>
            <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Seguimiento en tiempo real y gestión de flota inteligente</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary"><Filter size={18} /> Filtros</button>
            <button className="btn btn-primary"><Plus size={18} /> Nuevo Despacho</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.2fr', gap: '24px', height: 'calc(100vh - 250px)', minHeight: '600px' }}>
        
        {/* Left: Shipment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Buscar envío..." 
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', padding: '10px 12px 10px 36px', borderRadius: 12, fontSize: '0.85rem' }}
            />
          </div>
          
          {mockShipments.map(s => (
            <div 
              key={s.id}
              onClick={() => setActiveShipmentId(s.id)}
              className={`card ${activeShipmentId === s.id ? 'active' : ''}`}
              style={{ 
                padding: '20px', 
                cursor: 'pointer', 
                border: activeShipmentId === s.id ? '1px solid var(--primary-500)' : '1px solid var(--glass-border)',
                background: activeShipmentId === s.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--glass-bg)',
                transform: activeShipmentId === s.id ? 'scale(1.02)' : 'none'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)' }}>{s.id}</span>
                <span className={`badge ${s.status === 'Delivered' ? 'emerald' : s.status === 'Pending' ? 'amber' : 'purple'}`} style={{ fontSize: '0.65rem' }}>
                  {s.status}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{s.customer}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {s.destination}
              </div>
              <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                 <div style={{ width: `${s.progress}%`, height: '100%', background: s.progress === 100 ? 'var(--accent-emerald)' : 'var(--primary-500)', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Center: Interactive Map */}
        <div className="card" style={{ padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'flex', gap: 12 }}>
             <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(15px)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Destino Final</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{activeShipment.destination}</div>
             </div>
             <div style={{ background: activeShipment.status === 'Delivered' ? 'var(--accent-emerald)' : '#6366f1', color: 'white', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(15px)' }}>
                {activeShipment.status === 'Delivered' ? <ShieldCheck size={18} /> : <Compass className="animate-spin-slow" size={18} />}
                <span style={{ fontWeight: 700 }}>{activeShipment.status === 'Delivered' ? 'Entregado' : 'En Camino'}</span>
             </div>
          </div>

          <ShipmentMap route={activeShipment.route} progress={activeShipment.progress} />

          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, background: 'rgba(5, 5, 8, 0.75)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(25px)', borderRadius: 20, padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
               <div className="flex items-center gap-3">
                  <div className="avatar md" style={{ background: 'var(--primary-600)', borderRadius: 12 }}><Truck size={20} /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Transporte</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeShipment.vehicle}</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="avatar md" style={{ background: 'var(--accent-emerald)', borderRadius: 12 }}><Navigation size={20} /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Conductor</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeShipment.driver}</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="avatar md" style={{ background: 'var(--accent-amber)', borderRadius: 12 }}><Clock size={20} /></div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Entrega Estimada</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeShipment.eta}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Lifecycle Timeline */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 24 }}>
             <div>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', marginBottom: 12 }}>ID: {activeShipment.id}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ciclo de Vida</h3>
             </div>
          </div>

          <div style={{ padding: '24px 0', flex: 1, overflowY: 'auto', paddingLeft: 8 }}>
             {activeShipment.timeline.map((step, i) => (
               <div key={i} style={{ display: 'flex', gap: 20, position: 'relative', marginBottom: 28 }}>
                  {i !== activeShipment.timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: 20, top: 40, bottom: -28, width: 2, background: step.completed ? 'var(--primary-600)' : 'rgba(255,255,255,0.05)' }} />
                  )}
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    background: step.completed ? 'var(--primary-600)' : 'rgba(255,255,255,0.03)',
                    border: step.completed ? 'none' : '1px solid var(--glass-border)',
                    color: step.completed ? 'white' : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                     <step.icon size={18} />
                  </div>
                  <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 700, color: step.completed ? 'white' : 'var(--text-secondary)' }}>{step.status}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{step.date} • {step.time}</div>
                  </div>
               </div>
             ))}
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
             <button className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12 }}>Gestionar Incidencia</button>
             <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: '0.8rem' }}>Ver Documentación</button>
          </div>
        </div>

      </div>
    </div>
  )
}

function ShipmentMap({ route, progress }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#050508', position: 'relative' }}>
      {/* Abstract Map Grid */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.5
      }} />

      <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* The Route Path */}
        <path 
          d={`M ${route.from.x} ${route.from.y} Q ${(route.from.x + route.to.x)/2} ${(route.from.y + route.to.y)/2 - 100} ${route.to.x} ${route.to.y}`} 
          stroke="url(#routeGradient)" 
          strokeWidth="4" 
          fill="none" 
          strokeDasharray="10 5"
        />

        {/* Origin Dot */}
        <circle cx={route.from.x} cy={route.from.y} r="8" fill="rgba(255,255,255,0.2)" />
        <circle cx={route.from.x} cy={route.from.y} r="4" fill="#fff" />
        <text x={route.from.x - 20} y={route.from.y + 25} fill="var(--text-tertiary)" fontSize="12" fontWeight="600">{route.from.name}</text>

        {/* Destination Dot */}
        <circle cx={route.to.x} cy={route.to.y} r="12" fill="rgba(99,102,241,0.2)">
           <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={route.to.x} cy={route.to.y} r="6" fill="#6366f1" filter="url(#glow)" />
        <text x={route.to.x - 10} y={route.to.y + 30} fill="var(--text-primary)" fontSize="14" fontWeight="800">{route.to.name}</text>

        {/* Vehicle / Current Position */}
        <g transform={`translate(${route.current.x}, ${route.current.y})`}>
          <circle r="20" fill="rgba(99,102,241,0.1)">
             <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle r="6" fill="#6366f1" filter="url(#glow)" />
          {/* Animated Wave */}
          <circle r="6" fill="none" stroke="#6366f1" strokeWidth="2">
             <animate attributeName="r" values="6;22" dur="1.5s" repeatCount="indefinite" />
             <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  )
}

function Plus(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14"/></svg>
  )
}
