import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useTenant } from '../lib/useTenant'
import { supabase } from '../lib/supabase'

export default function Billing() {
  const tenant = useTenant()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  
  // Base prices in COP for specific clients
  const PRICING_MAP = {
    'c91119cc-5451-4a64-b0e8-6b53d33d5563': 1650000, // Activo Morrales
    'f920ca15-badb-4492-a344-e8d04f9f8c02': 600000,  // Samaritana
    'c90f532b-0b32-4614-9c21-bbf664213468': 600000,  // Trazzos
    '281db48e-b43b-4399-8d7d-d629fe936944': 1800000, // Importaller
  }

  // Base price in COP if not defined in DB or PRICING_MAP
  const DEFAULT_PRICE_COP = PRICING_MAP[tenant.clientId] || 150000

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!tenant.clientId) return
      
      const { data, error } = await supabase
        .from('clients')
        .select('name, subscription_price, subscription_status')
        .eq('id', tenant.clientId)
        .single()
        
      if (!error && data) {
        setClientData(data)
      }
      setLoading(false)
    }
    
    fetchBillingData()
  }, [tenant.clientId])

  const handlePayWompi = () => {
    // Determine the price: If DB has it, use it. Otherwise use default.
    const priceToPay = clientData?.subscription_price || DEFAULT_PRICE_COP
    const priceInCents = priceToPay * 100 // Wompi requires cents

    // Generate a unique reference for this transaction
    const reference = `NEXUS-${tenant.clientId}-${Date.now()}`

    // Initialize Wompi Widget
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: priceInCents,
      reference: reference,
      publicKey: 'pub_test_X0zJV0qDeWHqcTy8m4d3z5OECMeH9vT7', // Wompi Test Key (Replace with Production Key)
      redirectUrl: window.location.origin + '/pagos' // Redirect back to this page
    })

    checkout.open(function (result) {
      const transaction = result.transaction
      if (transaction.status === 'APPROVED') {
        alert('¡Pago aprobado exitosamente! Tu transacción es: ' + transaction.id)
        // Here you would normally update the DB or send a webhook to confirm payment
      } else {
        alert('El pago no fue aprobado. Estado: ' + transaction.status)
      }
    })
  }

  // Load Wompi script on mount
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.wompi.co/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Cargando información de facturación...</div>
  }

  const priceToPay = clientData?.subscription_price || DEFAULT_PRICE_COP
  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(priceToPay)
  const isPaid = clientData?.subscription_status === 'active'

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <CreditCard size={32} color="var(--primary-500)" />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Facturación y Pagos</h1>
      </div>

      <div style={{ 
        background: 'rgba(var(--overlay-rgb), 0.03)', 
        border: '1px solid var(--glass-border)', 
        borderRadius: '24px', 
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        
        {isPaid ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>¡Tu suscripción está Activa!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Gracias por confiar en NexusCRM. Tienes acceso completo a todas las funciones omnicanal y de Inteligencia Artificial.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Plan Nexus Premium</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Ciclo de facturación actual para <strong>{clientData?.name || tenant.clientName}</strong>.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-500)' }}>{formattedPrice}</span>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.85rem' }}>COP / mes</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} color="#10b981"/> Pago 100% Seguro</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Tus pagos son procesados de forma segura a través de <strong>Wompi (Bancolombia)</strong>. Aceptamos tarjetas de crédito, débito, PSE y transferencias.
                </p>
              </div>
              <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.5rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} /> Pago Pendiente</h4>
                <p style={{ fontSize: '0.9rem', color: '#b45309', lineHeight: 1.5, margin: 0 }}>
                  Tu suscripción se encuentra pendiente de pago. Por favor, realiza el pago para continuar disfrutando del servicio sin interrupciones.
                </p>
              </div>
            </div>

            <button 
              onClick={handlePayWompi}
              style={{
                background: 'linear-gradient(135deg, #001A72 0%, #0047BA 100%)', // Wompi Blue Colors
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 10px 25px rgba(0, 71, 186, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Pagar de forma segura con Wompi
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>
              Al hacer clic, se abrirá la pasarela de pagos Wompi.
            </p>

          </div>
        )}

      </div>
    </div>
  )
}
