import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, Target, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, ChevronRight, Activity, Zap
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { supabase } from '../lib/supabase'

const mainChartData = [
  { name: 'Jan', value: 32000, value2: 28000 },
  { name: 'Feb', value: 45000, value2: 35000 },
  { name: 'Mar', value: 42000, value2: 38000 },
  { name: 'Apr', value: 38000, value2: 48000 },
  { name: 'May', value: 55000, value2: 42000 },
  { name: 'Jun', value: 68000, value2: 58000 },
  { name: 'Jul', value: 62000, value2: 55000 },
  { name: 'Aug', value: 75000, value2: 68000 },
  { name: 'Sep', value: 89000, value2: 72000 },
  { name: 'Oct', value: 78000, value2: 75000 },
  { name: 'Nov', value: 85000, value2: 82000 },
  { name: 'Dec', value: 95000, value2: 88000 },
]

const sparklineData = [
  { pv: 2400 }, { pv: 1398 }, { pv: 9800 }, { pv: 3908 }, { pv: 4800 }, { pv: 3800 }, { pv: 4300 },
]

const recentDeals = [
  { lead: 'Alex Banner', stage: 'Opening', value: '$10.00k', date: '08/03/2026', color: '#10b981' },
  { lead: 'Anner Daterson', stage: 'Succeed', value: '$15.00k', date: '03/02/2026', color: '#6366f1' },
  { lead: 'James Wilson', stage: 'Contract', value: '$8.50k', date: '01/02/2026', color: '#f59e0b' },
]

const pipelineData = [
  { name: 'Lead', value: 45, color: '#6366f1' },
  { name: 'Contact', value: 32, color: '#10b981' },
  { name: 'Proposal', value: 24, color: '#f59e0b' },
  { name: 'Negotiation', value: 18, color: '#ec4899' },
  { name: 'Closing', value: 12, color: '#8b5cf6' },
]

export default function Dashboard() {
  const { session } = useOutletContext()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Artificial delay for premium loading feel
    setTimeout(() => setIsLoading(false), 800)
  }, [])

  return (
    <div className="page-content" style={{ padding: '32px' }}>
      <div className="page-header animate-slideUp">
        <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {/* LTV Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LTV</span>
             <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>+12.5%</span>
          </div>
          <div className="stat-card-value">$1.4M</div>
          <div style={{ height: 40, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Sales</span>
             <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700 }}>+18.2%</span>
          </div>
          <div className="stat-card-value">$2.8M</div>
          <div style={{ height: 40, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="pv" stroke="#6366f1" fill="rgba(99, 102, 241, 0.1)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Deals Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Deals</span>
             <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="stat-card-value">312</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: 4 }}>+5.3% this month</div>
        </div>

        {/* New Leads Card */}
        <div className="stat-card">
          <div className="card-header" style={{ marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>New Leads</span>
             <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="stat-card-value">450</div>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600, marginTop: 4 }}>-2.1% lower trend</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card" style={{ marginBottom: '32px', padding: '32px' }}>
        <div className="card-header" style={{ marginBottom: '32px' }}>
           <div>
              <h3 className="card-title" style={{ fontSize: '1.2rem' }}>Sales Performance</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Metric performance across key channels</p>
           </div>
           <button className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>This Year <ChevronDown size={14} /></button>
        </div>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mainChartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVal2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ fontSize: '0.85rem' }}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="value2" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal2)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Recent Deals */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Deals</h3>
            <MoreHorizontal size={16} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>LEAD</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>STAGE</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>VALUE</th>
                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>CLOSE DATE</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((deal, i) => (
                <tr key={i} style={{ borderBottom: i === recentDeals.length - 1 ? 'none' : '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, fontSize: '0.9rem' }}>{deal.lead}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge" style={{ background: `${deal.color}15`, color: deal.color }}>{deal.stage}</span>
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: 700 }}>{deal.value}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{deal.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pipeline Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pipeline Status</h3>
            <MoreHorizontal size={16} />
          </div>
          <div style={{ height: 220, marginTop: 24 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {pipelineData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronDown(props) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}
