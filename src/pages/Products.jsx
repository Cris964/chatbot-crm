import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../lib/useTenant'
import * as XLSX from 'xlsx'
import {
  Package, Plus, Search, Edit, Trash2, Tag, DollarSign,
  CheckCircle2, XCircle, Megaphone, X, Save, ToggleLeft, ToggleRight,
  Upload, Download
} from 'lucide-react'

const categoryColors = {
  'Porcelanato': 'emerald',
  'Cerámica': 'emerald',
  'Grifería': 'cyan',
  'Baños': 'blue',
  'Cocinas': 'amber',
  'Pegante': 'purple',
  'Servicios': 'rose',
  'Digestión': 'emerald',
  'Circulación': 'cyan',
  'Salud General': 'purple',
  'Salud Masculina': 'blue',
  'Articulaciones': 'amber',
  'Energía': 'rose',
  'Otro': 'neutral',
}

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  category: 'Otro',
  active: true,
  promo_text: '',
  stock: 0,
  min_stock: 0,
  image_url: ''
}

export default function Products() {
  const { session } = useOutletContext()
  const tenant = useTenant()

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (tenant.clientId && !tenant.isLoading) {
      fetchProducts()
    }
  }, [tenant.clientId, tenant.isLoading])

  const fetchProducts = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('client_id', tenant.clientId)
      .order('active', { ascending: false })
      .order('name')

    if (!error && data) setProducts(data)
    setIsLoading(false)
  }

  const openCreate = () => {
    setEditingProduct(null)
    setForm(EMPTY_PRODUCT)
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || 'Otro',
      active: product.active,
      promo_text: product.promo_text || '',
      stock: product.stock || 0,
      min_stock: product.min_stock || 0,
      image_url: product.image_url || ''
    })
    setShowModal(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)

      const productsToInsert = data.map(row => ({
        name: row.Nombre || row.name || '',
        description: row.Descripcion || row.description || '',
        price: parseFloat(row.Precio || row.price || 0),
        category: row.Categoria || row.category || 'Otro',
        stock: parseInt(row.Stock || row.stock || 0),
        min_stock: parseInt(row.StockMinimo || row.min_stock || 0),
        active: true,
        client_id: tenant.clientId
      }))

      const { error } = await supabase.from('products').insert(productsToInsert)
      if (!error) fetchProducts()
      else alert('Error al importar: ' + error.message)
    }
    reader.readAsBinaryString(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      category: form.category,
      active: form.active,
      promo_text: form.promo_text.trim() || null,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      image_url: form.image_url.trim() || null,
      client_id: tenant.clientId,
      updated_at: new Date().toISOString(),
    }

    let error
    if (editingProduct) {
      ;({ error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id))
    } else {
      ;({ error } = await supabase
        .from('products')
        .insert(payload))
    }

    if (!error) {
      setShowModal(false)
      fetchProducts()
    } else {
      alert('Error: ' + error.message)
    }
    setIsSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto del catálogo?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const toggleActive = async (product) => {
    await supabase
      .from('products')
      .update({ active: !product.active, updated_at: new Date().toISOString() })
      .eq('id', product.id)
    fetchProducts()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = products.filter(p => p.active).length
  const promoCount = products.filter(p => p.promo_text).length

  return (
    <div className="page-content" style={{ padding: 32 }}>
      <div className="page-header animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Catálogo de Productos</h1>
            <p className="page-subtitle">
              Define el inventario que tu agente IA usará para responder — {tenant.clientName}
            </p>
          </div>
          {tenant.isAdmin && (
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => {
                const ws = XLSX.utils.json_to_sheet([{
                  Nombre: 'Ejemplo Porcelanato',
                  Descripcion: 'Porcelanato 60x60 para alto trafico',
                  Precio: 55000,
                  Categoria: 'Porcelanato',
                  Stock: 100,
                  StockMinimo: 10
                }]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
                XLSX.writeFile(wb, 'Plantilla_Inventario_Trazzos.xlsx');
              }}>
                <Download size={18} /> Plantilla
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={18} /> Importar Excel
                <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              </label>
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} /> Nuevo Producto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        <div className="stat-card animate-slideUp stagger-1">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Productos</span>
            <div className="stat-card-icon purple"><Package size={18} /></div>
          </div>
          <div className="stat-card-value">{products.length}</div>
        </div>
        <div className="stat-card animate-slideUp stagger-2">
          <div className="stat-card-header">
            <span className="stat-card-label">Activos (IA los ve)</span>
            <div className="stat-card-icon emerald"><CheckCircle2 size={18} /></div>
          </div>
          <div className="stat-card-value">{activeCount}</div>
        </div>
        <div className="stat-card animate-slideUp stagger-3">
          <div className="stat-card-header">
            <span className="stat-card-label">Con Promoción</span>
            <div className="stat-card-icon amber"><Megaphone size={18} /></div>
          </div>
          <div className="stat-card-value">{promoCount}</div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 16, padding: '14px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)'
      }}>
        <Package size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
        <span>
          Los productos <strong style={{ color: "var(--text-primary)" }}>activos</strong> son inyectados automáticamente al prompt de tu agente IA.
          Las <strong style={{ color: 'var(--accent-amber)' }}>promociones</strong> aparecen destacadas en las respuestas del bot.
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar producto..."
          style={{ paddingLeft: 38 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="card animate-slideUp stagger-2" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Promoción Activa</th>
              <th>Estado IA</th>
              {tenant.isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Cargando catálogo...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <Package size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.4, marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay productos. Agrega el primero para activar el agente IA.'}
                  </p>
                  {!searchQuery && tenant.isAdmin && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={openCreate}>
                      <Plus size={14} /> Agregar Primer Producto
                    </button>
                  )}
                </td>
              </tr>
            ) : filtered.map((product, i) => (
              <tr key={product.id} style={{ opacity: product.active ? 1 : 0.5 }}>
                <td>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{product.name}</div>
                    {product.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 300 }}>
                        {product.description.length > 80 ? product.description.slice(0, 80) + '...' : product.description}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`badge ${categoryColors[product.category] || 'neutral'}`}>
                    {product.category || 'Otro'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: product.price > 0 ? 'var(--accent-emerald)' : 'var(--text-tertiary)' }}>
                  {product.price > 0 ? `$${product.price?.toLocaleString()}` : 'N/A'}
                </td>
                <td>
                  <div className="flex flex-col">
                    <span style={{ fontWeight: 700, color: product.stock <= product.min_stock ? 'var(--accent-rose)' : 'white' }}>
                      {product.stock} und
                    </span>
                    {product.stock <= product.min_stock && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', fontWeight: 600 }}>Stock Bajo</span>
                    )}
                  </div>
                </td>
                <td>
                  {product.promo_text ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Megaphone size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.promo_text}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>Sin promo</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => tenant.isAdmin && toggleActive(product)}
                    style={{ background: 'none', border: 'none', cursor: tenant.isAdmin ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}
                    title={tenant.isAdmin ? (product.active ? 'Desactivar (IA no lo verá)' : 'Activar') : ''}
                  >
                    {product.active ? (
                      <><ToggleRight size={22} style={{ color: 'var(--accent-emerald)' }} /><span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Activo</span></>
                    ) : (
                      <><ToggleLeft size={22} style={{ color: 'var(--text-tertiary)' }} /><span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Inactivo</span></>
                    )}
                  </button>
                </td>
                {tenant.isAdmin && (
                  <td>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(product)} title="Editar">
                        <Edit size={15} />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(product.id)} title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(10px)' }}>
          <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800 }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Nombre del Producto *</label>
                  <input type="text" required className="form-input" placeholder="Ej: KOLOSAL" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Descripción</label>
                  <textarea className="form-input" rows={2} placeholder="Beneficios, uso, ingredientes..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Precio (COP)</label>
                  <input type="number" className="form-input" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Categoría</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {Object.keys(categoryColors).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Stock Actual *</label>
                  <input type="number" required className="form-input" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Stock Mínimo (Alerta)</label>
                  <input type="number" className="form-input" placeholder="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    🔥 Texto de Promoción Activa
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Por la compra llévate GRATIS una Casigua"
                    value={form.promo_text}
                    onChange={e => setForm({ ...form, promo_text: e.target.value })}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    La IA mencionará esta promo cuando recomiende el producto.
                  </p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    URL de la Imagen (Opcional)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Ej: https://tudominio.com/foto.jpg"
                    value={form.image_url}
                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    El chatbot de IA enviará esta imagen directamente por WhatsApp cuando ofrezca el producto.
                  </p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <button type="button" onClick={() => setForm({ ...form, active: !form.active })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {form.active
                        ? <ToggleRight size={28} style={{ color: 'var(--accent-emerald)' }} />
                        : <ToggleLeft size={28} style={{ color: 'var(--text-tertiary)' }} />}
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {form.active ? 'Producto activo — la IA lo incluirá en sus respuestas' : 'Producto inactivo — la IA lo ignorará'}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <Save size={16} />
                  {isSaving ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
