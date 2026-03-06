import '../styles/globals.css'
import { useState, useEffect, createContext, useContext } from 'react'

export const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function App({ Component, pageProps }) {
  const [dark, setDark] = useState(true)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('theme') ?? 'dark'
    const u = localStorage.getItem('crm_user')
    setDark(t === 'dark')
    if (u) try { setUser(JSON.parse(u)) } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const login = u => { setUser(u); localStorage.setItem('crm_user', JSON.stringify(u)) }
  const logout = () => { setUser(null); localStorage.removeItem('crm_user') }

  if (!ready) return null

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <Component {...pageProps} toggleTheme={() => setDark(d => !d)} dark={dark} />
    </AuthCtx.Provider>
  )
}
