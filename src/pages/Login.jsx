import { useState } from 'react'
import { ArrowRight, AlertCircle, Bot, Zap, Globe, Layers } from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from '../components/NexusLogo'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
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
    if(onLogin) onLogin(data.session)
  }

  const networkSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000' viewBox='0 0 1000 1000'%3E%3Cg stroke='rgba(99, 102, 241, 0.25)' stroke-width='1.5' fill='none'%3E%3Cpath d='M100 100L300 250L200 500Z'/%3E%3Cpath d='M300 250L600 200L550 550L200 500Z'/%3E%3Cpath d='M600 200L850 150L800 450L550 550'/%3E%3Cpath d='M200 500L150 800L450 750L550 550'/%3E%3Cpath d='M450 750L750 850L800 450'/%3E%3Cpath d='M300 250L500 50'/%3E%3Cpath d='M100 100L50 400L200 500'/%3E%3Cpath d='M850 150L950 300L800 450'/%3E%3Cpath d='M750 850L900 700L800 450'/%3E%3C/g%3E%3Cg fill='rgba(129, 140, 248, 0.7)'%3E%3Ccircle cx='100' cy='100' r='4'/%3E%3Ccircle cx='300' cy='250' r='6'/%3E%3Ccircle cx='200' cy='500' r='5'/%3E%3Ccircle cx='600' cy='200' r='7'/%3E%3Ccircle cx='550' cy='550' r='6'/%3E%3Ccircle cx='850' cy='150' r='4'/%3E%3Ccircle cx='800' cy='450' r='5'/%3E%3Ccircle cx='150' cy='800' r='4'/%3E%3Ccircle cx='450' cy='750' r='6'/%3E%3Ccircle cx='750' cy='850' r='5'/%3E%3Ccircle cx='500' cy='50' r='4'/%3E%3Ccircle cx='50' cy='400' r='3'/%3E%3Ccircle cx='950' cy='300' r='3'/%3E%3Ccircle cx='900' cy='700' r='4'/%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="login-split-container">
      
      <style>{`
        .login-split-container {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .login-left-panel {
          flex: 1.3;
          position: relative;
          background: radial-gradient(circle at bottom right, #31135e 0%, #0f172a 50%, #020617 100%);
          display: flex;
          flex-direction: column;
          padding: 6% 8%;
          color: white;
          overflow: hidden;
        }
        
        .login-right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 10%;
          background: #ffffff;
          color: #0f172a;
          max-width: 600px;
          z-index: 20;
        }

        /* --- RESPONSIVE MOBILE --- */
        @media (max-width: 1024px) {
           .login-split-container {
              flex-direction: column;
              overflow-y: auto;
           }
           
           .login-left-panel {
              flex: none;
              padding: 40px 24px;
              min-height: auto;
              overflow: visible;
           }

           .login-right-panel {
              flex: none;
              max-width: 100%;
              padding: 40px 24px;
              background: #ffffff;
              border-radius: 32px 32px 0 0;
              margin-top: -30px; /* Sobreponer el formulario un poco sobre el fondo oscuro */
              min-height: 50vh;
              box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
           }
           
           /* Reducir el tamaño de los títulos en móvil */
           .login-left-panel h1 { font-size: 2.2rem !important; }
           .badges-container { flex-wrap: wrap; gap: 1.5rem !important; }
        }

        /* Red animada de fondo */
        .network-bg {
          position: absolute;
          inset: -20%;
          background-image: url("${networkSvg}");
          background-size: 800px 800px;
          background-repeat: repeat;
          z-index: 1;
          opacity: 0.8;
          animation: panNetwork 60s linear infinite;
        }

        @keyframes panNetwork {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(-5%, -5%) rotate(2deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        
        .ai-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 60%);
          z-index: 2;
          animation: pulseGlow 8s ease-in-out infinite alternate;
        }

        @keyframes pulseGlow {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.1); }
        }

        .glass-feature {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-top: auto;
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .modern-input-group {
          margin-bottom: 1.25rem;
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
        <div style={{ marginBottom: '2.5rem' }}>
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

        <form onSubmit={handleSubmit}>
          <div className="modern-input-group">
            <label>Correo Electronico</label>
            <input 
              type="email" 
              className="modern-input" 
              placeholder="tu@empresa.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="modern-input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              className="modern-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <a href="#" style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Verificando...' : (
               <>Ingresar a Nexus <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>

    </div>
  )
}
