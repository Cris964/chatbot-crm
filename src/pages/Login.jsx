import { useState } from 'react'
import { Sparkles, Mail, Lock, ArrowRight, Sun, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    // First try to authenticate against Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onLogin(data.session)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Logo Area */}
      <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          width: 56, height: 56, 
          background: 'var(--primary-600)', 
          borderRadius: 16, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={28} color="white" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Nexus<span style={{color: 'var(--primary-400)'}}>CRM</span></h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: 8 }}>Plataforma de gestión inteligente</p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ zIndex: 1, width: '100%', maxWidth: 420, padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Bienvenido de vuelta <span style={{fontSize: '1.1rem'}}>👋</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Ingresa a tu panel de control</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="tu@empresa.com" 
                style={{ paddingLeft: 40 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••••••" 
                style={{ paddingLeft: 40 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '0.5rem', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>Ingresar al panel <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
            <Sun size={14} /> Modo claro
          </button>
        </div>
      </div>
      
      <p style={{ zIndex: 1, color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '2rem' }}>
        NexusCRM © 2026
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
