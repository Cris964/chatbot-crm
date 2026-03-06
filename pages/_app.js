import '../styles/globals.css'
import { useState, useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setDark(saved === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return <Component {...pageProps} toggleTheme={() => setDark(!dark)} dark={dark} />
}
