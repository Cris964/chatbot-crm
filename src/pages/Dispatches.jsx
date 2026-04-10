import { useState } from 'react'
import {
  Truck, Package, MapPin, Navigation, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Search, Filter, MoreHorizontal,
  Globe, Info, Phone, Calendar
} from 'lucide-react'

const orderTimeline = [
  { status: 'Order Received', date: 'Mar 10, 2026', time: '09:00 AM', completed: true, icon: Package },
  { status: 'Payment Confirmed', date: 'Mar 10, 2026', time: '10:30 AM', completed: true, icon: CheckCircle2 },
  { status: 'In Production', date: 'Mar 11, 2026', time: '02:15 PM', completed: true, icon: Info },
  { status: 'Quality Check', date: 'Mar 12, 2026', time: '08:45 AM', completed: false, icon: AlertCircle },
  { status: 'Out for Delivery', date: 'TBD', time: 'TBD', completed: false, icon: Truck },
]

export default function Dispatches() {
  const [selectedOrder, setSelectedOrder] = useState({
    id: 'NX-9982',
    customer: 'Sarah Johnson',
    destination: 'San Francisco, CA',
    status: 'In Transit',
    eta: '2 days',
    driver: 'Robert Fox',
    vehicle: 'Tesla Semi #4'
  })

  return (
    <div className="page-content" style={{ padding: '32px' }}>
      <div className="page-header animate-slideUp">
        <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Global Logistics</h1>
        <p className="page-subtitle">Nexus Precision Tracking & Fleet Management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Map Widget Mockup */}
          <div className="card" style={{ height: 450, padding: 0, position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'flex', gap: 12 }}>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(10px)' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Shipments</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>1,245</div>
                </div>
                <div style={{ background: '#10b981', color: 'white', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                   <Navigation size={18} />
                   <span style={{ fontWeight: 700 }}>On Track</span>
                </div>
             </div>
             
             {/* Mock Map Background */}
             <div style={{ width: '100%', height: '100%', background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {/* SVG Route Mockup */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                   <path d="M100 300 Q 300 100 500 250 T 800 200" stroke="#6366f1" strokeWidth="3" fill="none" strokeDasharray="8 4" />
                   <circle cx="100" cy="300" r="6" fill="#10b981" />
                   <circle cx="800" cy="200" r="8" fill="#6366f1" />
                </svg>
             </div>

             <div className="card-header" style={{ position: 'absolute', bottom: 24, left: 24, right: 24, background: 'rgba(5, 5, 8, 0.6)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', borderRadius: 16 }}>
                <div className="flex items-center justify-between w-full">
                   <div className="flex items-center gap-4">
                      <div className="avatar md" style={{ background: 'var(--primary-600)' }}><Truck /></div>
                      <div>
                         <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>In Transit to SF</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Driver: {selectedOrder.driver} • {selectedOrder.vehicle}</div>
                      </div>
                   </div>
                   <button className="btn btn-primary btn-sm">View Full Route</button>
                </div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Fleet Efficiency</h3>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>94.2%</div>
                   <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: 6 }}>+2.4 this week</div>
                </div>
                <div style={{ marginTop: 20, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                   <div style={{ width: '94.2%', height: '100%', background: '#6366f1', borderRadius: 2 }} />
                </div>
             </div>
             <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Average TAT</h3>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                   <div style={{ fontSize: '2rem', fontWeight: 800 }}>1.8 Days</div>
                   <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginBottom: 6 }}>-12% decrease</div>
                </div>
                <div style={{ marginTop: 20, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                   <div style={{ width: '75%', height: '100%', background: '#10b981', borderRadius: 2 }} />
                </div>
             </div>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
           <div className="card-header" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 24 }}>
              <div>
                 <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', marginBottom: 12 }}>{selectedOrder.id}</div>
                 <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Order Lifecycle</h3>
              </div>
              <button className="btn btn-ghost btn-sm"><Info size={20} /></button>
           </div>

           <div style={{ padding: '32px 0', flex: 1, paddingLeft: 12 }}>
              {orderTimeline.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, position: 'relative', marginBottom: 32 }}>
                   {i !== orderTimeline.length - 1 && (
                     <div style={{ position: 'absolute', left: 24, top: 44, bottom: -24, width: 2, background: step.completed ? 'var(--primary-600)' : 'rgba(255,255,255,0.05)' }} />
                   )}
                   <div style={{ 
                     width: 48, 
                     height: 48, 
                     borderRadius: 16, 
                     background: step.completed ? 'var(--primary-600)' : 'rgba(255,255,255,0.03)',
                     border: step.completed ? 'none' : '1px solid var(--glass-border)',
                     color: step.completed ? 'white' : 'var(--text-tertiary)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     zIndex: 1
                   }}>
                      <step.icon size={22} />
                   </div>
                   <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: step.completed ? 'white' : 'var(--text-secondary)' }}>{step.status}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{step.date} • {step.time}</div>
                   </div>
                </div>
              ))}
           </div>

           <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, marginTop: 'auto' }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>Print Shipping Label</button>
           </div>
        </div>
      </div>
    </div>
  )
}
