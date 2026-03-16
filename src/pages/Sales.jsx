import { useState } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, Calendar, Filter,
  Download, MoreHorizontal, ArrowUpRight, Eye, FileText, Search
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const monthlyData = [
  { month: 'Ene', ventas: 42000 },
  { month: 'Feb', ventas: 38000 },
  { month: 'Mar', ventas: 55000 },
  { month: 'Abr', ventas: 49000 },
  { month: 'May', ventas: 62000 },
  { month: 'Jun', ventas: 58000 },
  { month: 'Jul', ventas: 71000 },
  { month: 'Ago', ventas: 68000 },
  { month: 'Sep', ventas: 79000 },
  { month: 'Oct', ventas: 85000 },
  { month: 'Nov', ventas: 91000 },
  { month: 'Dic', ventas: 98000 },
]

const sales = [
  { id: 'INV-1042', client: 'TechCorp SA', contact: 'María González', product: 'Plan Enterprise Anual', amount: '$24,000', date: 'Mar 12, 2026', payment: 'Pagado', method: 'Transferencia', avatar: 'MG', bg: '#10b981' },
  { id: 'INV-1041', client: 'CloudsDev', contact: 'Roberto Díaz', product: 'Migración Cloud', amount: '$48,000', date: 'Mar 10, 2026', payment: 'Parcial', method: 'Tarjeta', avatar: 'RD', bg: '#06b6d4' },
  { id: 'INV-1040', client: 'Digital Co', contact: 'Ana Rodríguez', product: 'CRM Profesional', amount: '$15,800', date: 'Mar 8, 2026', payment: 'Pagado', method: 'Transferencia', avatar: 'AR', bg: '#ec4899' },
  { id: 'INV-1039', client: 'LogisTech', contact: 'Fernando Castro', product: 'ERP Implementación', amount: '$45,000', date: 'Mar 5, 2026', payment: 'Pendiente', method: '-', avatar: 'FC', bg: '#f59e0b' },
  { id: 'INV-1038', client: 'Media Plus', contact: 'Laura Sánchez', product: 'Pack Starter Anual', amount: '$9,200', date: 'Mar 3, 2026', payment: 'Pagado', method: 'PayPal', avatar: 'LS', bg: '#8b5cf6' },
  { id: 'INV-1037', client: 'Global Net', contact: 'Carlos Medina', product: 'Integración API', amount: '$22,000', date: 'Mar 1, 2026', payment: 'Pagado', method: 'Transferencia', avatar: 'CM', bg: '#f43f5e' },
  { id: 'INV-1036', client: 'StartUp IO', contact: 'Juan Pérez', product: 'Consultoría Digital', amount: '$8,500', date: 'Feb 28, 2026', payment: 'Vencido', method: '-', avatar: 'JP', bg: '#6366f1' },
]

function getPaymentBadge(status) {
  const map = { 'Pagado': 'emerald', 'Parcial': 'amber', 'Pendiente': 'violet', 'Vencido': 'rose' }
  return map[status] || 'neutral'
}

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.product.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Ventas</h1>
            <p className="page-subtitle">Control completo de facturación y revenue</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary"><Download size={16} /> Exportar</button>
            <button className="btn btn-primary"><DollarSign size={16} /> Registrar Venta</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card emerald animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue Total (2026)</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">$796,000</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> +18.4% vs 2025</div>
        </div>
        <div className="stat-card purple animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Ventas del Mes</span>
            <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">$98,000</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> +7.7% vs anterior</div>
        </div>
        <div className="stat-card cyan animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Ticket Promedio</span>
            <div className="stat-card-icon cyan"><CreditCard size={20} /></div>
          </div>
          <div className="stat-card-value">$24,640</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> +5.2%</div>
        </div>
        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Por Cobrar</span>
            <div className="stat-card-icon amber"><Calendar size={20} /></div>
          </div>
          <div className="stat-card-value">$53,500</div>
          <div className="stat-card-change negative" style={{ color: 'var(--accent-amber)' }}>3 facturas pendientes</div>
        </div>
      </div>

      <div className="chart-card animate-slideUp stagger-3" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Ventas Mensuales 2026</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="#6b6b80" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b6b80" tick={{ fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
            <Tooltip
              contentStyle={{ background: 'rgba(22,22,31,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
              formatter={(v) => [`$${v.toLocaleString()}`, 'Ventas']}
            />
            <Bar dataKey="ventas" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card animate-slideUp stagger-4" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700 }}>Historial de Ventas</h3>
          <div className="flex gap-2">
            <div className="search-bar" style={{ maxWidth: 220 }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Buscar venta..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="filter-btn"><Filter size={14} /> Filtros</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Pago</th>
              <th>Método</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="table-row-hover">
                <td><span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{sale.id}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar sm" style={{ background: sale.bg }}>{sale.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{sale.client}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sale.contact}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{sale.product}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{sale.amount}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{sale.date}</td>
                <td><span className={`badge ${getPaymentBadge(sale.payment)}`}>{sale.payment}</span></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{sale.method}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm"><Eye size={14} /></button>
                    <button className="btn btn-ghost btn-sm"><FileText size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No se encontraron ventas con "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}
