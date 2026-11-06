import { useState, useEffect } from 'react'
import {
  ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, Loader2,
  MessageCircle, Sparkles, ShieldCheck, Mail
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import NexusLogo from '../components/NexusLogo'

const FEATURES = [
  { icon: MessageCircle, title: 'Omnicanal', text: 'WhatsApp, Instagram y Messenger en un solo hilo.' },
  { icon: Sparkles, title: 'IA aplicada', text: 'Respuestas asistidas y seguimiento automático.' },
  { icon: ShieldCheck, title: 'Infraestructura segura', text: 'Datos y tokens cifrados por empresa.' },
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // En escritorio el foco va al correo; en móvil no (el teclado tapa el formulario).
  useEffect(() => {
    const id = setTimeout(() => {
      if (window.innerWidth > 900) document.getElementById('login-email')?.focus()
    }, 430)
    return () => clearTimeout(id)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        if (onLogin) onLogin(data.user)
        else window.location.href = '/'
      }
    } catch (err) {
      setError(
        /invalid login credentials/i.test(err.message)
          ? 'Correo o contraseña incorrectos. Verifica los datos e inténtalo de nuevo.'
          : err.message
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Escribe tu correo electrónico para enviarte el enlace de recuperación.')
      return
    }
    setIsLoading(true)
    setError(null)
    setResetSuccess(false)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      setResetSuccess(true)
      setTimeout(() => { setIsResetting(false); setResetSuccess(false) }, 6000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          background: #fff;
          font-family: var(--font-sans, 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif);
        }

        /* ---------- panel de marca ---------- */
        .login-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(24px, 4vh, 48px);
          padding: clamp(28px, 5vh, 56px) clamp(28px, 5vw, 72px);
          color: #fff;
          overflow: hidden;
          background:
            radial-gradient(900px 520px at 88% 96%, rgba(99, 102, 241, .32), transparent 62%),
            radial-gradient(700px 480px at 8% 4%, rgba(16, 185, 129, .14), transparent 60%),
            linear-gradient(160deg, #131A2E 0%, #0B1020 58%, #070B18 100%);
        }
        .login-brand::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .2;
          background-image:
            linear-gradient(rgba(148, 163, 184, .16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, .16) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%);
          animation: loginGridIn 1.6s cubic-bezier(.16, 1, .3, 1) both;
        }
        .login-brand > * { position: relative; z-index: 1; }

        .login-logo { display: inline-flex; align-items: center; gap: 8px; color: #fff; font-weight: 800; font-size: 19px; letter-spacing: -.02em; }

        .login-copy { max-width: 33rem; margin-top: auto; margin-bottom: auto; }
        .login-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
          color: #C7D2FE; margin-bottom: 18px;
        }
        .login-eyebrow i { width: 6px; height: 6px; border-radius: 50%; background: #10B981; box-shadow: 0 0 0 4px rgba(16, 185, 129, .18); }
        .login-copy h1 {
          margin: 0 0 16px;
          font-size: clamp(26px, 2.8vw, 42px);
          line-height: 1.1;
          letter-spacing: -.03em;
          font-weight: 800;
          color: #fff;
        }
        .login-copy h1 em { font-style: normal; color: #A5B4FC; }
        .login-copy p { margin: 0; font-size: clamp(14px, 1vw, 16px); line-height: 1.65; color: #C3CBDA; max-width: 27rem; }

        .login-features { display: grid; gap: 14px; margin-top: 34px; }
        .login-feature { display: flex; gap: 12px; align-items: flex-start; }
        .login-feature .ic {
          width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center;
          border-radius: 10px; color: #A5B4FC;
          background: rgba(255, 255, 255, .06);
          border: 1px solid rgba(255, 255, 255, .1);
        }
        .login-feature strong { display: block; font-size: 13.5px; color: #fff; margin-bottom: 2px; }
        .login-feature span { font-size: 12.5px; color: #AEB8CC; line-height: 1.45; }

        /* ---------- panel del formulario ---------- */
        .login-form-side {
          display: flex; align-items: center; justify-content: center;
          padding: 32px clamp(20px, 4vw, 56px);
          background: linear-gradient(180deg, #fff, #FBFCFF);
        }
        .login-card { width: 100%; max-width: 404px; }
        .login-card h2 { margin: 0 0 6px; font-size: 26px; letter-spacing: -.02em; font-weight: 800; color: #0F172A; }
        .login-card .sub { margin: 0 0 26px; font-size: 14px; color: #64748B; }

        .login-field { margin-bottom: 16px; }
        .login-field label {
          display: block; margin-bottom: 7px; font-size: 13px; font-weight: 600; color: #334155;
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%; height: 50px; padding: 0 44px 0 14px;
          font: inherit; font-size: 16px; color: #0F172A;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .login-input::placeholder { color: #94A3B8; }
        .login-input:hover { border-color: #CBD5E1; }
        .login-input:focus {
          outline: none; border-color: #4F46E5; background: #fff;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, .14);
        }
        .login-input:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
        .login-eye {
          position: absolute; top: 50%; right: 4px; transform: translateY(-50%);
          width: 42px; height: 42px; display: grid; place-items: center;
          background: transparent; border: 0; border-radius: 9px;
          color: #64748B; cursor: pointer;
          transition: background .15s, color .15s;
        }
        .login-eye:hover { background: #EEF2F7; color: #334155; }
        .login-eye:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }

        .login-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin: 2px 0 18px; }
        .login-link {
          font-size: 13px; font-weight: 600; color: #4F46E5; background: none; border: 0;
          cursor: pointer; padding: 6px 0; min-height: 32px;
        }
        .login-link:hover { text-decoration: underline; }

        .login-submit {
          width: 100%; height: 52px; display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          font: inherit; font-size: 15px; font-weight: 650; color: #fff; cursor: pointer;
          background: linear-gradient(135deg, #6366F1, #4338CA);
          border: 0; border-radius: 12px;
          box-shadow: 0 2px 4px rgba(79, 70, 229, .24), 0 12px 24px -12px rgba(79, 70, 229, .62);
          transition: transform .12s ease, box-shadow .18s ease, filter .18s ease;
        }
        .login-submit:hover:not(:disabled) { filter: brightness(1.05); }
        .login-submit:active:not(:disabled) { transform: translateY(1px); }
        .login-submit:focus-visible { outline: 2px solid #4338CA; outline-offset: 3px; }
        .login-submit:disabled { opacity: .8; cursor: progress; }

        .login-alert {
          display: flex; align-items: flex-start; gap: 10px;
          margin: 0 0 20px; padding: 12px 14px;
          font-size: 13px; line-height: 1.45; color: #9F1239;
          background: #FFF1F2; border: 1px solid #FECDD3; border-left: 3px solid #E11D48;
          border-radius: 10px;
        }
        .login-ok {
          display: flex; align-items: flex-start; gap: 10px;
          margin: 0 0 20px; padding: 12px 14px;
          font-size: 13px; color: #065F46;
          background: #ECFDF5; border: 1px solid #A7F3D0; border-left: 3px solid #10B981;
          border-radius: 10px;
        }

        .login-foot { margin: 26px 0 0; font-size: 12.5px; color: #64748B; text-align: center; }

        /* ---------- animación de entrada ---------- */
        @keyframes loginRiseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes loginFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes loginGridIn { from { opacity: 0; transform: scale(1.04); } to { opacity: .2; transform: none; } }

        .anim { animation: loginRiseIn .62s cubic-bezier(.16, 1, .3, 1) both; }
        .d1 { animation-delay: .06s; }
        .d2 { animation-delay: .14s; }
        .d3 { animation-delay: .22s; }
        .d4 { animation-delay: .3s; }
        .d5 { animation-delay: .38s; }
        .d6 { animation-delay: .46s; }
        .login-brand .login-copy { animation: loginFadeIn .8s ease both; }

        /* ---------- móvil: formulario primero ---------- */
        @media (max-width: 900px) {
          .login-page { grid-template-columns: 1fr; grid-template-rows: auto 1fr; align-content: start; }
          .login-brand { padding: calc(16px + env(safe-area-inset-top)) 20px 20px; gap: 0; }
          .login-brand::after { opacity: .12; background-size: 44px 44px; }
          .login-copy { display: none; }
          .login-tagline { display: block; margin: 10px 0 0; font-size: 12.5px; line-height: 1.45; color: #AEB8CC; max-width: 34ch; }
          .login-form-side {
            align-items: flex-start;
            padding: 22px 20px calc(28px + env(safe-area-inset-bottom));
            background: #fff;
            border-radius: 22px 22px 0 0;
            margin-top: -14px;
            position: relative;
            z-index: 2;
            box-shadow: 0 -12px 32px -18px rgba(11, 16, 32, .5);
          }
          .login-card { max-width: 440px; margin: 0 auto; }
          .login-card h2 { font-size: 23px; }
        }
        @media (min-width: 901px) { .login-tagline { display: none; } }

        @media (prefers-reduced-motion: reduce) {
          .anim, .login-brand::after, .login-brand .login-copy { animation: none !important; }
        }
      `}</style>

      {/* ---------- marca ---------- */}
      <aside className="login-brand">
        <div className="login-logo anim d1">
          <NexusLogo size={26} />
          <span>Nexus</span>
          <span style={{ color: '#A5B4FC' }}>CRM</span>
        </div>

        <div className="login-copy">
          <div className="login-eyebrow"><i /> Plataforma omnicanal con IA</div>
          <h1>
            Tu operación comercial,<br />
            <em>en una sola bandeja.</em>
          </h1>
          <p>
            WhatsApp, Instagram y Messenger en el mismo hilo, con seguimiento
            automático de pipeline y respuestas asistidas por IA.
          </p>

          <div className="login-features">
            {FEATURES.map((f, i) => (
              <div className={`login-feature anim d${i + 3}`} key={f.title}>
                <div className="ic"><f.icon size={16} /></div>
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="login-tagline">
          Bandeja omnicanal, pipeline y automatizaciones con IA en un solo lugar.
        </p>
      </aside>

      {/* ---------- formulario ---------- */}
      <main className="login-form-side">
        <div className="login-card">
          <h2 className="anim d2">{isResetting ? 'Recuperar acceso' : 'Inicia sesión'}</h2>
          <p className="sub anim d3">
            {isResetting
              ? 'Te enviaremos un enlace para restablecer tu contraseña.'
              : 'Entra al panel de control de tu empresa.'}
          </p>

          {error && (
            <div className="login-alert anim" role="alert">
              <AlertCircle size={16} style={{ flex: '0 0 auto', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          {resetSuccess && (
            <div className="login-ok anim" role="status">
              <CheckCircle2 size={16} style={{ flex: '0 0 auto', marginTop: 1 }} />
              <span>Listo. Revisa tu correo y sigue el enlace para crear una nueva contraseña.</span>
            </div>
          )}

          {isResetting ? (
            <form onSubmit={handleResetPassword} className="anim d4" noValidate>
              <div className="login-field">
                <label htmlFor="reset-email">Correo electrónico</label>
                <div className="login-input-wrap">
                  <input
                    id="reset-email"
                    className="login-input"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    spellCheck="false"
                    autoCapitalize="off"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="login-submit" type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 size={17} className="spin" /> Enviando…</> : <>Enviar enlace <ArrowRight size={17} /></>}
              </button>

              <p className="login-foot">
                <button type="button" className="login-link" onClick={() => { setIsResetting(false); setError(null) }}>
                  Volver al inicio de sesión
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="anim d4" noValidate>
              <div className="login-field">
                <label htmlFor="login-email">Correo electrónico</label>
                <div className="login-input-wrap">
                  <input
                    id="login-email"
                    name="email"
                    className="login-input"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    spellCheck="false"
                    autoCapitalize="off"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Contraseña</label>
                <div className="login-input-wrap">
                  <input
                    id="login-password"
                    name="password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-row anim d5">
                <button type="button" className="login-link" onClick={() => { setIsResetting(true); setError(null) }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button className="login-submit anim d5" type="submit" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={17} className="spin" /> Verificando…</>
                  : <>Entrar <ArrowRight size={17} /></>}
              </button>
            </form>
          )}

          <p className="login-foot anim d6">
            <Mail size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            ¿Sin acceso? Escríbenos a soporte@nexusgrouptec.com
          </p>
        </div>
      </main>
    </div>
  )
}
