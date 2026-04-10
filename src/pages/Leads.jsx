import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search, Filter, Plus, MoreHorizontal, ArrowUpDown, Download, Upload,
  Mail, Phone, MapPin, Calendar, Tag, Star, Eye, Trash2, UserPlus,
  ChevronDown, CheckSquare, Square, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function getSourceBadge(source) {
  const map = { 'WhatsApp': 'emerald', 'Instagram': 'pink', 'Facebook': 'cyan', 'Formulario': 'purple', 'Email': 'amber' }
  return map[source] || 'neutral'
}

function getStageBadge(stage) {
  const map = { 'Nuevo': 'purple', 'Contactado': 'cyan', 'Interesado': 'violet', 'Negociación': 'amber', 'Venta Cerrada': 'emerald', 'Venta Perdida': 'rose' }
  return map[stage] || 'neutral'
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : 'var(--text-tertiary)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

export default function Leads() {
  const { session } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [leads, setLeads] = useState([
    { id: 1, name: 'Alex Banner', email: 'alex@banner.com', company: 'Global Tech', source: 'WhatsApp', stage: 'Nuevo', score: 85, value: '$12,500', created_at: new Date().toISOString() },
    { id: 2, name: 'Sarah Miller', email: 'sarah@design.co', company: 'Design Co', source: 'Instagram', stage: 'Contactado', score: 62, value: '$8,200', created_at: new Date().toISOString() },
    { id: 3, name: 'James Wilson', email: 'james@build.io', company: 'Build IT', source: 'Formulario', stage: 'Interesado', score: 45, value: '$15,000', created_at: new Date().toISOString() },
  ])
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="page-content" style={{ padding: '32px' }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Leads Management</h1>
            <p className="page-subtitle">Track and nurture your sales opportunities</p>
          </div>
          <div className="flex gap-3">
             <button className="btn btn-secondary"><Upload size={18} /> Import</button>
             <button className="btn btn-primary"><Plus size={18} /> Create Lead</button>
          </div>
        </div>
      </div>

      <div className="filters-bar" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderRadius: 16, marginBottom: 24, border: '1px solid var(--glass-border)' }}>
        <div className="header-search" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={18} />
          <input type="text" placeholder="Search by name, company or email..." />
        </div>
        <div className="flex gap-2">
           {['All Status', 'Source', 'Priority', 'Assigned'].map(f => (
             <button key={f} className="btn btn-ghost btn-sm" style={{ fontSize: '0.85rem' }}>{f} <ChevronDown size={14} /></button>
           ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
           <thead>
             <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>LEAD INFO</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>SOURCE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>STAGE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>SCORE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>DEAL VALUE</th>
                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>ACTIONS</th>
             </tr>
           </thead>
           <tbody>
             {leads.map((l, i) => (
               <tr key={l.id} className="table-row-hover" style={{ borderBottom: i === leads.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                 <td style={{ padding: '24px' }}>
                    <div className="flex items-center gap-4">
                       <div className="avatar md" style={{ background: 'linear-gradient(135deg, #6366f1, #a5b4fc)' }}>{l.name.substring(0,2).toUpperCase()}</div>
                       <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{l.company} • {l.email}</div>
                       </div>
                    </div>
                 </td>
                 <td><span className={`badge ${getSourceBadge(l.source)}`}>{l.source}</span></td>
                 <td><span className={`badge ${getStageBadge(l.stage)}`}>{l.stage}</span></td>
                 <td><ScoreBadge score={l.score} /></td>
                 <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{l.value}</td>
                 <td>
                    <div className="flex gap-2">
                       <button className="btn btn-ghost btn-sm"><Mail size={16} /></button>
                       <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  )
}
