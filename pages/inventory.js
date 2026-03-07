import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Inventory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef();

  const emptyForm = {
    name: '', description: '', benefits: '', ingredients: '',
    keywords: '', image_url: '', stock: 0, price: '', active: true
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (!stored) { router.push('/'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setClientId(u.clientId);
  }, []);

  useEffect(() => {
    if (clientId) fetchProducts();
  }, [clientId]);

  async function fetchProducts() {
    setLoading(true);
    let query = supabase.from('inventory').select('*').order('name');
    if (clientId !== 'admin') query = query.eq('client_id', clientId);
    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditProduct(p);
    setForm({
      name: p.name || '', description: p.description || '',
      benefits: p.benefits || '', ingredients: p.ingredients || '',
      keywords: p.keywords || '', image_url: p.image_url || '',
      stock: p.stock ?? 0, price: p.price || '', active: p.active ?? true
    });
    setShowModal(true);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      setForm(f => ({ ...f, image_url: publicUrl }));
      showToast('Imagen subida ✓');
    } catch (err) {
      showToast('Error subiendo imagen: ' + err.message, 'error');
    }
    setUploadingImage(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('El nombre es requerido', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        stock: parseInt(form.stock) || 0,
        price: form.price ? parseFloat(form.price) : null,
        client_id: clientId === 'admin' ? (editProduct?.client_id || clientId) : clientId,
        updated_at: new Date().toISOString()
      };
      if (editProduct) {
        await supabase.from('inventory').update(payload).eq('id', editProduct.id);
        showToast('Producto actualizado ✓');
      } else {
        await supabase.from('inventory').insert(payload);
        showToast('Producto agregado ✓');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    setSaving(false);
  }

  async function toggleActive(p) {
    await supabase.from('inventory').update({ active: !p.active }).eq('id', p.id);
    fetchProducts();
  }

  async function updateStock(p, delta) {
    const newStock = Math.max(0, (p.stock || 0) + delta);
    await supabase.from('inventory').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: newStock } : x));
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    await supabase.from('inventory').delete().eq('id', p.id);
    showToast('Producto eliminado');
    fetchProducts();
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.benefits?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((a, p) => a + (p.stock || 0), 0);
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8ede4', fontFamily: "'Lato', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#ff4444' : '#2d7a4f',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontWeight: 600,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2f1e 0%, #0f1117 100%)',
        borderBottom: '1px solid #2a3f2e', padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: '1px solid #3a5a3e', color: '#7dc47e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
            ← Dashboard
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#a8d5a2' }}>🌿 Inventario de Productos</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#5a7a5e' }}>Gestiona tu catálogo, stock y fotos</p>
          </div>
        </div>
        <button onClick={openNew} style={{
          background: 'linear-gradient(135deg, #2d7a4f, #1a5a35)',
          color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
        }}>
          + Agregar Producto
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total en Stock', value: totalStock, icon: '📦', color: '#2d7a4f' },
            { label: 'Sin Stock', value: outOfStock, icon: '❌', color: '#c0392b' },
            { label: 'Stock Bajo (≤5)', value: lowStock, icon: '⚠️', color: '#e67e22' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'linear-gradient(135deg, #1a2a1e, #141a17)',
              border: `1px solid ${s.color}40`, borderRadius: 14, padding: '18px 24px',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#5a7a5e' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar producto..."
            style={{
              background: '#1a2a1e', border: '1px solid #2a3f2e', borderRadius: 10,
              color: '#e8ede4', padding: '10px 16px', fontSize: 14, width: '100%',
              maxWidth: 400, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#5a7a5e', padding: 60 }}>Cargando inventario...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5a7a5e', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <div>No hay productos aún. Agrega el primero.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                background: 'linear-gradient(135deg, #1a2a1e, #141a17)',
                border: p.stock === 0 ? '1px solid #c0392b40' : p.stock <= 5 ? '1px solid #e67e2240' : '1px solid #2a3f2e',
                borderRadius: 16, overflow: 'hidden',
                opacity: p.active ? 1 : 0.5,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                {/* Product Image */}
                <div style={{ position: 'relative', height: 160, background: '#0f1a12', overflow: 'hidden' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#2a3f2e', fontSize: 48 }}>🌿</div>
                  )}
                  {/* Stock badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: p.stock === 0 ? '#c0392b' : p.stock <= 5 ? '#e67e22' : '#2d7a4f',
                    color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700
                  }}>
                    {p.stock === 0 ? 'AGOTADO' : `${p.stock} uds`}
                  </div>
                  {/* Active toggle */}
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <button onClick={() => toggleActive(p)} style={{
                      background: p.active ? '#2d7a4f' : '#555', border: 'none', borderRadius: 20,
                      padding: '3px 10px', fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 600
                    }}>
                      {p.active ? '● Activo' : '○ Inactivo'}
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#a8d5a2' }}>{p.name}</h3>
                    {p.price && <span style={{ color: '#7dc47e', fontWeight: 700, fontSize: 14 }}>${Number(p.price).toLocaleString()}</span>}
                  </div>
                  {p.benefits && (
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5a7a7e', lineHeight: 1.4 }}>
                      {p.benefits.length > 80 ? p.benefits.slice(0, 80) + '...' : p.benefits}
                    </p>
                  )}

                  {/* Stock controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#5a7a5e' }}>Stock:</span>
                    <button onClick={() => updateStock(p, -1)}
                      style={{ background: '#c0392b30', border: '1px solid #c0392b', color: '#e07070', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 16, minWidth: 30, textAlign: 'center', color: p.stock === 0 ? '#c0392b' : '#a8d5a2' }}>{p.stock}</span>
                    <button onClick={() => updateStock(p, 1)}
                      style={{ background: '#2d7a4f30', border: '1px solid #2d7a4f', color: '#7dc47e', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(p)} style={{
                      flex: 1, background: '#1a3a2e', border: '1px solid #2a5a3e',
                      color: '#7dc47e', borderRadius: 8, padding: '7px', fontSize: 13, cursor: 'pointer', fontWeight: 600
                    }}>✏️ Editar</button>
                    <button onClick={() => handleDelete(p)} style={{
                      background: '#3a1a1a', border: '1px solid #5a2a2a',
                      color: '#e07070', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer'
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar/Editar */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#1a2a1e', border: '1px solid #2a4a2e', borderRadius: 20,
            padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#a8d5a2', fontSize: 18 }}>
                {editProduct ? '✏️ Editar Producto' : '+ Nuevo Producto'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#5a7a5e', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: 18, textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, borderRadius: 12, overflow: 'hidden',
                background: '#0f1a12', border: '2px dashed #2a4a2e',
                margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative'
              }} onClick={() => fileInputRef.current?.click()}>
                {form.image_url ? (
                  <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 36 }}>📷</span>
                )}
                {uploadingImage && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7dc47e', fontSize: 12 }}>
                    Subiendo...
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()}
                style={{ background: '#1a3a2e', border: '1px solid #2a5a3e', color: '#7dc47e', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                {form.image_url ? '📷 Cambiar foto' : '📷 Subir foto'}
              </button>
            </div>

            {/* Fields */}
            {[
              { label: 'Nombre del producto *', key: 'name', placeholder: 'Ej: BRIL-PROS' },
              { label: 'Descripción', key: 'description', placeholder: 'Bebida 500ml para...' },
              { label: 'Beneficios (para qué sirve)', key: 'benefits', placeholder: 'Próstata, vías urinarias...' },
              { label: 'Ingredientes', key: 'ingredients', placeholder: 'Perejil, apio, arándano...' },
              { label: 'Palabras clave (separadas por coma)', key: 'keywords', placeholder: 'prostata,próstata,vías urinarias,erección' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#7dc47e', marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
                {['benefits', 'ingredients', 'keywords'].includes(f.key) ? (
                  <textarea value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} rows={2}
                    style={{ width: '100%', background: '#0f1a12', border: '1px solid #2a4a2e', borderRadius: 8, color: '#e8ede4', padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                ) : (
                  <input value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: '#0f1a12', border: '1px solid #2a4a2e', borderRadius: 8, color: '#e8ede4', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#7dc47e', marginBottom: 5, fontWeight: 600 }}>Stock inicial</label>
                <input type="number" value={form.stock} onChange={e => setForm(x => ({ ...x, stock: e.target.value }))}
                  min="0"
                  style={{ width: '100%', background: '#0f1a12', border: '1px solid #2a4a2e', borderRadius: 8, color: '#e8ede4', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#7dc47e', marginBottom: 5, fontWeight: 600 }}>Precio (opcional)</label>
                <input type="number" value={form.price} onChange={e => setForm(x => ({ ...x, price: e.target.value }))}
                  placeholder="25000"
                  style={{ width: '100%', background: '#0f1a12', border: '1px solid #2a4a2e', borderRadius: 8, color: '#e8ede4', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input type="checkbox" id="active" checked={form.active}
                onChange={e => setForm(x => ({ ...x, active: e.target.checked }))} />
              <label htmlFor="active" style={{ fontSize: 13, color: '#a8d5a2', cursor: 'pointer' }}>Producto activo (visible para la IA)</label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, background: '#1a2a1e', border: '1px solid #2a4a2e', color: '#5a7a5e', borderRadius: 10, padding: 12, cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, background: 'linear-gradient(135deg, #2d7a4f, #1a5a35)', border: 'none', color: '#fff', borderRadius: 10, padding: 12, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}>
                {saving ? 'Guardando...' : editProduct ? '✓ Guardar cambios' : '+ Agregar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2a3f2e; border-radius: 3px; }
        input[type=checkbox] { accent-color: #2d7a4f; width: 16px; height: 16px; cursor: pointer; }
      `}</style>
    </div>
  );
}
