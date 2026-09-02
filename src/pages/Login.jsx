import { useState } from 'react'
import { ArrowRight, AlertCircle, Bot, Zap, Globe, Layers, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from '../components/NexusLogo'
import AnimatedBot from '../components/AnimatedBot'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Animation states
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Reset states
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        onLogin(data.user)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para restablecer la contraseña.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setResetSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background-color: #0f172a;
          color: white;
        }

        .login-left-panel {
          flex: 1.2;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          position: relative;
          overflow: hidden;
          padding: 4rem;
          display: flex;
          flex-direction: column;
        }

        .network-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
          z-index: 1;
        }

        .ai-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%);
          top: -100px;
          left: -100px;
          border-radius: 50%;
          z-index: 1;
        }

        .glass-feature {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-top: auto;
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .login-right-panel {
          flex: 0.8;
          background: #ffffff;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: #0f172a;
        }

        .modern-input-group {
          margin-bottom: 1.25rem;
          position: relative;
        }
        .modern-input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }
        .modern-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          background: #f8fafc;
          transition: all 0.2s;
          color: #0f172a;
        }
        .modern-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          width: 100%;
          padding: 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 1rem;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 36px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .password-toggle:hover {
          color: #6366f1;
        }
      `}</style>

      {/* --- COLUMNA IZQUIERDA (Info Nexus Premium) --- */}
      <div className="login-left-panel">
        <div className="network-bg"></div>
        <div className="ai-glow"></div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
            <NexusLogo size={42} />
            <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Nexus<span style={{color: '#818cf8'}}>CRM</span></span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              El CRM Omnicanal impulsado por Inteligencia Artificial.
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#cbd5e1', maxWidth: '500px', lineHeight: 1.6, fontWeight: 400 }}>
              Automatiza la atencion, centraliza ventas y domina la omnicanalidad (WhatsApp, Instagram, Messenger) en una sola plataforma del futuro.
            </p>
          </div>

          <div className="glass-feature">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#818cf8" /> Innovacion Tecnologica
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
              Nexus AI procesa conversaciones complejas en tiempo real, conectandose de forma nativa a la infraestructura de Meta. Diseñado para empresas que buscan escalar su operacion a nivel global.
            </p>
          </div>

          <div className="badges-container" style={{ display: 'flex', gap: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
               <Globe size={28} color="#818cf8" />
               <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Omnicanalidad</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/>
                  <path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/>
                  <path d="m19.07 4.93-1.41 1.41"/>
               </svg>
               <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Meta Partner</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
               <Bot size={28} color="#818cf8" />
               <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>AI Powered</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
               <Layers size={28} color="#818cf8" />
               <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Infraestructura Segura</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- COLUMNA DERECHA (Login Form) --- */}
      <div className="login-right-panel">
        <AnimatedBot 
            emailLength={email.length} 
            isEmailFocused={isEmailFocused}
            isPasswordFocused={isPasswordFocused && !showPassword} 
        />
        
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Iniciar Sesion</h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Accede a tu panel de control Nexus.
          </p>
        </div>

        {error && (
          <div style={{ padding: '14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            {error === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error}
          </div>
        )}

        {resetSuccess && (
          <div style={{ padding: '14px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} />
            Se ha enviado un enlace de recuperación a tu correo.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modern-input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              className="modern-input" 
              placeholder="tu@empresa.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              required
            />
          </div>

          {!isResetting && (
            <div className="modern-input-group">
              <label>Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="modern-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {!isResetting && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
              <button 
                type="button"
                onClick={() => setIsResetting(true)}
                style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <span style={{ color: '#cbd5e1', margin: '0 10px' }}>|</span>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Por tu seguridad, inicia sesión primero para calcular automáticamente el valor exacto de tu suscripción en la pasarela.'); }} style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Pagar mi Suscripción
              </a>
            </div>
          )}

          {isResetting ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={handleResetPassword} className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar link de recuperación'}
              </button>
              <button type="button" onClick={() => { setIsResetting(false); setError(null); setResetSuccess(false); }} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Verificando...' : (
                <>Ingresar a Nexus <ArrowRight size={18} /></>
              )}
            </button>
          )}
        </form>
      </div>

    </div>
  )
}
