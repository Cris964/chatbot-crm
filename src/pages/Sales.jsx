import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  DollarSign, TrendingUp, CreditCard, Calendar, Filter,
  Download, MoreHorizontal, ArrowUpRight, Eye, FileText, Search, Truck
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const monthlyData = [
  { month: 'Ene', ventas: 4000 },
  { month: 'Feb', ventas: 3000 },
  { month: 'Mar', ventas: 2000 },
]

function getPaymentBadge(status) {
  const map = { 'Pagado': 'emerald', 'Parcial': 'amber', 'Pendiente': 'violet', 'Vencido': 'rose' }
  return map[status] || 'neutral'
}

export default function Sales() {
  const { session } = useOutletContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [salesList, setSalesList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserClient, setCurrentUserClient] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (session?.user?.id) {
        // Encontrar a qué client_id pertenece este usuario
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .single()
        
        if (client) {
          setCurrentUserClient(client.id)
          fetchSales(client.id)
        } else {
          // Si no está vinculado a un cliente, intentar cargar todos por si acaso (o avisar)
          fetchSales()
        }
      }
    }
    init()
  }, [session])

  const fetchSales = async (clientId) => {
    setIsLoading(true)
    let query = supabase.from('orders').select('*')
    
    // Si tenemos un clientId, lo usamos para filtrar (Multitenant)
    const targetId = clientId || currentUserClient
    if (targetId) {
      query = query.eq('client_id', targetId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (!error && data) {
      setSalesList(data.map(d => ({
        id: d.id,
        client: d.user_name || 'Cliente',
        product: d.product || 'Producto',
        amount: d.total || 25000, 
        date: new Date(d.created_at).toLocaleDateString(),
        payment: d.status === 'pagado' ? 'Pagado' : 'Pendiente',
        method: d.payment_method || 'WhatsApp',
        city: d.city || 'N/A',
        address: d.address || 'N/A',
        avatar: (d.user_name || 'C').substring(0,2).toUpperCase(),
        bg: d.status === 'pagado' ? '#10b981' : '#6366f1',
        isNew: (new Date() - new Date(d.created_at)) < (1000 * 60 * 60 * 6)
      })))
    }
    setIsLoading(false)
  }

  const handleManualSale = async () => {
    const product = prompt('Nombre del producto (ej: CX-P):');
    if (!product) return;
    const amountStr = prompt('Precio de venta:');
    const amount = parseInt(amountStr) || 0;
    
    // Obtener el client_id actual del usuario (doble check)
    const { data: userClient } = await supabase.from('clients').select('id').eq('user_id', session.user.id).single();
    
    if (!userClient) {
       alert('Error: No se encontró la configuración del comercio vinculado a tu usuario.');
       return;
    }

    const { error } = await supabase.from('orders').insert({
      client_id: userClient.id,
      product: product,
      user_name: 'Venta Manual',
      status: 'pagado',
      total: amount,
      created_at: new Date().toISOString()
    });

    if (error) alert('Error al crear: ' + error.message);
    else fetchSales(userClient.id);
  }

  const totalRevenue = salesList.reduce((acc, s) => acc + s.amount, 0)
  const monthlySales = salesList.length
  const ticketAvg = salesList.length > 0 ? totalRevenue / salesList.length : 0

  const filteredSales = salesList.filter(sale => {
    const query = searchQuery.toLowerCase();
    return (
      (sale.id?.toString() || '').toLowerCase().includes(query) ||
      (sale.client?.toLowerCase() || '').includes(query) ||
      (sale.product?.toLowerCase() || '').includes(query)
    );
  })

  return (
    <div className="page-content">
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Ventas</h1>
            <p className="page-subtitle">Control completo de facturación y revenue</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => fetchSales()}><Download size={16} /> Refrescar</button>
            <button className="btn btn-primary" onClick={handleManualSale}>
              <DollarSign size={16} /> Registrar Venta
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card emerald animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue Total</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">${totalRevenue.toLocaleString()}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> Actualizado hoy</div>
        </div>
        <div className="stat-card purple animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Órdenes Realizadas</span>
            <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">{monthlySales}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> Total facturado</div>
        </div>
        <div className="stat-card cyan animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Ticket Promedio</span>
            <div className="stat-card-icon cyan"><CreditCard size={20} /></div>
          </div>
          <div className="stat-card-value">${ticketAvg.toLocaleString()}</div>
          <div className="stat-card-change positive"><ArrowUpRight size={14} /> Por venta</div>
        </div>
        <div className="stat-card amber animate-slideUp stagger-4">
          <div className="stat-card-header">
            <span className="stat-card-label">Pendientes</span>
            <div className="stat-card-icon amber"><Calendar size={20} /></div>
          </div>
          <div className="stat-card-value">$0</div>
          <div className="stat-card-change" style={{ color: 'var(--text-tertiary)' }}>No hay deudas</div>
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
                <td><span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{sale.id?.slice(0,8)}</span> {sale.isNew && <span className="badge amber" style={{ fontSize: '0.6rem' }}>NUEVA</span>}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar sm" style={{ background: sale.bg }}>{sale.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{sale.client}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sale.city}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{sale.product}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>${sale.amount.toLocaleString()}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{sale.date}</td>
                <td><span className={`badge ${getPaymentBadge(sale.payment)}`}>{sale.payment}</span></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{sale.method}</td>
                <td>
                  <div className="flex gap-2">
                    {sale.payment === 'Pagado' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
                        onClick={async () => {
                           const { error } = await supabase.from('orders').update({ status: 'despachado' }).eq('id', sale.id);
                           if (!error) fetchSales();
                        }}
                      >
                        <Truck size={14} /> Despachar
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm"><Eye size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            {searchQuery ? `No se encontraron ventas con "${searchQuery}"` : "Aún no hay ventas registradas."}
          </div>
        )}
      </div>
    </div>
  )
}
