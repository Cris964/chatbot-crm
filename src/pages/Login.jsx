import { useState } from 'react'
import { ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from '../components/NexusLogo'
import AnimatedBot from '../components/AnimatedBot'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // States for animation
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  // State for reset password
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
      setError('Por favor, ingresa tu correo electrnico para restablecer la contrasea.');
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
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
        }
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background: #f4f7fe;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-container {
          display: flex;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          width: 100%;
          max-width: 1100px;
          min-height: 650px;
        }

        /* --- Left Side: Branding --- */
        .login-left {
          flex: 1;
          background: linear-gradient(135deg, #4318FF 0%, #39B8FF 100%);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 2rem;
          font-weight: 800;
          z-index: 2;
          margin-bottom: auto;
        }

        .brand-content {
          z-index: 2;
          margin-bottom: auto;
        }

        .brand-content h1 {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        .brand-content p {
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.6;
          max-width: 400px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          z-index: 2;
        }

        /* --- Right Side: Form --- */
        .login-right {
          flex: 1;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #ffffff;
        }

        .login-right-header {
          margin-bottom: 1rem;
          text-align: center;
        }

        .login-right-header h2 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .login-right-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .clean-input {
          width: 100%;
          padding: 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          color: #0f172a;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .clean-input:focus {
          outline: none;
          border-color: #4318FF;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.1);
        }

        .btn-submit {
          background: #4318FF;
          color: white;
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 1rem;
          box-shadow: 0 4px 14px 0 rgba(67, 24, 255, 0.39);
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(67, 24, 255, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
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
          color: #4318FF;
        }

        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-container { max-width: 500px; min-height: auto; }
          .login-right { padding: 3rem 2rem; }
        }
      `}</style>

      <div className="login-container">
        
        {/* LEFT COLUMN */}
        <div className="login-left">
          <div className="brand-header">
            <NexusLogo size={36} color="#ffffff" />
            <span>Nexus</span>
          </div>

          <div className="brand-content">
            <h1>El futuro del CRM.</h1>
            <p>
              Automatiza la atención, centraliza tus ventas y domina la omnicanalidad con IA, todo en una plataforma con un diseño espectacular.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#e0e7ff' }}>
              Sistema 100% Cloud
            </div>
            <div style={{ fontSize: '0.85rem', color: '#c7d2fe', lineHeight: 1.5 }}>
              Integrado nativamente con la API de Meta para WhatsApp, Instagram y Messenger.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="login-right">
          
          <AnimatedBot 
            emailLength={email.length} 
            isEmailFocused={isEmailFocused}
            isPasswordFocused={isPasswordFocused && !showPassword} 
          />

          <div className="login-right-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus datos para continuar.</p>
          </div>

          {error && (
            <div style={{ padding: '14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div className="input-group">
              <label>Correo Electrónico</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  className="clean-input" 
                  placeholder="admin@empresa.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  required
                />
              </div>
            </div>

            {!isResetting && (
              <div className="input-group">
                <label>Contraseña</label>
                <div className="input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="clean-input" 
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
              </div>
            )}

            {!isResetting && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#4318FF' }} />
                  Recordarme
                </label>
                <button 
                  type="button"
                  onClick={() => setIsResetting(true)} 
                  style={{ color: '#4318FF', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {isResetting ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button type="button" onClick={handleResetPassword} className="btn-submit" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar link de recuperación'}
                </button>
                <button type="button" onClick={() => { setIsResetting(false); setError(null); setResetSuccess(false); }} style={{ background: 'transparent', color: '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Ingresar a Nexus'}
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Por tu seguridad, inicia sesión primero para calcular automáticamente el valor exacto de tu suscripción en la pasarela.'); }} style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
                Pagar mi Suscripción
              </a>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
