import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useAuth } from './_app'

export default function Login({ toggleTheme, dark }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => { if (user) router.replace('/dashboard') }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    // Admin check
    if (email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@botcrm.com') &&
        pass  === (process.env.NEXT_PUBLIC_ADMIN_PASS  || 'Admin2026!')) {
      login({ email, role: 'admin', name: 'Administrador', clientId: null })
      return
    }

    // Client check from Supabase
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, active')
      .eq('email', email)
      .eq('client_password', pass)
      .eq('active', true)
      .maybeSingle()

    if (data) {
      login({ email, role: 'client', name: data.name, clientId: data.id })
    } else {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden font-lato">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 floating" style={{background:'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter:'blur(60px)'}} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 floating" style={{animationDelay:'2s', background:'radial-gradient(circle, #10b981 0%, transparent 70%)', filter:'blur(60px)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30" style={{background:'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 60%)'}} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize:'48px 48px'}} />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 fade-up stagger-1">
          <div className="inline-block relative floating">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-4xl font-black noise-overlay relative"
              style={{background:'linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)', boxShadow:'0 24px 64px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'}}>
              B
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-ink-950 relative live-ring" />
          </div>
          <h1 className="text-[2.5rem] font-black text-white mt-5 tracking-tight leading-none">
            Bot<span className="grad-text">CRM</span>
          </h1>
          <p className="text-ink-400 text-sm font-light mt-2 tracking-wide">Plataforma de gestión de ChatBots</p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl p-8 noise-overlay fade-up stagger-2"
          style={{background:'linear-gradient(145deg, rgba(22,22,42,0.95), rgba(17,17,32,0.98))', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter:'blur(40px)'}}>

          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{background:'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)'}} />

          <h2 className="text-xl font-bold text-white mb-1">Bienvenido de vuelta 👋</h2>
          <p className="text-ink-400 text-sm mb-7">Ingresa a tu panel de control</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="fade-up stagger-3">
              <label className="block text-[11px] font-bold text-ink-300 uppercase tracking-[0.1em] mb-2">Correo electrónico</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@empresa.com" required
                  className="inp w-full pl-10 pr-4 py-3.5 rounded-xl text-sm" />
              </div>
            </div>

            {/* Password */}
            <div className="fade-up stagger-4">
              <label className="block text-[11px] font-bold text-ink-300 uppercase tracking-[0.1em] mb-2">Contraseña</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••••" required
                  className="inp w-full pl-10 pr-12 py-3.5 rounded-xl text-sm" />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-200 transition">
                  {showPass
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm fade-in" style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#fb7185'}}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="grad-btn w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 fade-up stagger-5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinning"/>Verificando...</>
                : <>Ingresar al panel <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex justify-center">
            <button onClick={toggleTheme} className="text-xs text-ink-500 hover:text-ink-300 transition flex items-center gap-2">
              {dark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>
          </div>
        </div>
        <p className="text-center text-ink-700 text-xs mt-5">BotCRM © 2026</p>
      </div>
    </div>
  )
}
