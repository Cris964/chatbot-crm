import { useState } from 'react'
import { useRouter } from 'next/router'

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin123'

export default function Login({ toggleTheme, dark }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 600))
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      localStorage.setItem('crm_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#0a0a0f] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4 shadow-lg shadow-brand-500/30">
            <span className="text-white text-2xl font-bold" style={{fontFamily:'Syne,sans-serif'}}>C</span>
          </div>
          <h1 className="text-3xl font-bold dark:text-white text-gray-900" style={{fontFamily:'Syne,sans-serif', letterSpacing:'-1px'}}>
            ChatBot<span className="text-brand-500">CRM</span>
          </h1>
          <p className="dark:text-gray-500 text-gray-400 text-sm mt-1">Panel de administración</p>
        </div>

        {/* Card */}
        <div className="dark:bg-[#111118] bg-white rounded-2xl border dark:border-white/5 border-gray-200 p-8 shadow-xl">
          <h2 className="text-lg font-semibold dark:text-white text-gray-800 mb-6">Iniciar sesión</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs dark:text-gray-500 text-gray-500 uppercase tracking-widest mb-2">Usuario</label>
              <input
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-xl px-4 py-3 dark:text-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-xs dark:text-gray-500 text-gray-500 uppercase tracking-widest mb-2">Contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full dark:bg-[#1a1a24] bg-gray-50 dark:border-white/5 border-gray-200 border rounded-xl px-4 py-3 dark:text-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : 'Entrar al panel'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button onClick={toggleTheme} className="text-xs dark:text-gray-600 text-gray-400 hover:text-brand-500 transition">
            {dark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
          </button>
        </div>
      </div>
    </div>
  )
}
