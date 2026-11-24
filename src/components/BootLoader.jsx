import { useEffect, useRef, useState } from 'react'

/**
 * Preloader de marca: el logo aparece, el nombre se "decodifica" letra por letra
 * y una línea fina marca el progreso antes de revelar la app.
 *
 * - Se muestra una vez por sesión (sessionStorage).
 * - Duración máxima 2,2 s: nunca hace esperar de más.
 * - Respeta prefers-reduced-motion.
 */

const WORD = 'NEXUSCRM'
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@'
const SEEN_KEY = 'nexus_boot_seen'

export default function BootLoader() {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState('')
  const rafRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let seen = false
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1' } catch {}
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (seen) return
    if (reduced) {
      try { sessionStorage.setItem(SEEN_KEY, '1') } catch {}
      return
    }

    setVisible(true)
    document.documentElement.style.overflow = 'hidden'

    const t0 = performance.now()
    const MAX = 2200
    const MIN = 900

    const tick = () => {
      const el = performance.now() - t0
      const loaded = document.readyState === 'complete'
      const base = Math.min(92, (el / MAX) * 100)
      const target = loaded && el > MIN ? 100 : base
      setProgress((p) => Math.max(p, Math.min(target, p + 3)))

      const reveal = Math.min(WORD.length, Math.floor((el / (MIN + 260)) * WORD.length))
      let out = ''
      for (let i = 0; i < WORD.length; i++) {
        out += i < reveal ? WORD[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      }
      setText(out)

      if (target >= 100 || el > MAX) {
        setProgress(100)
        setLeaving(true)
        document.documentElement.style.overflow = ''
        try { sessionStorage.setItem(SEEN_KEY, '1') } catch {}
        window.setTimeout(() => setVisible(false), 520)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.documentElement.style.overflow = ''
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`boot ${leaving ? 'boot-out' : ''}`} role="status" aria-live="polite" aria-label="Cargando NexusCRM">
      <style>{`
        .boot {
          position: fixed; inset: 0; z-index: 9999;
          display: grid; place-items: center;
          background: radial-gradient(900px 560px at 50% 40%, rgba(67,83,255,.20), transparent 62%),
                      linear-gradient(165deg, #0E1330 0%, #070B18 70%);
          color: #fff; transition: opacity .5s ease;
        }
        .boot-out { opacity: 0; pointer-events: none; }
        .boot::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .16;
          background-image: linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(70% 60% at 50% 50%, #000 20%, transparent 75%); }
        .boot-inner { position: relative; z-index: 1; display: flex; flex-direction: column;
          align-items: center; gap: 18px; }
        .boot-mark { width: 58px; height: 58px; animation: bootPop .7s cubic-bezier(.16,1,.3,1) both; }
        .boot-word { font-size: clamp(20px,3vw,28px); font-weight: 800; letter-spacing: .06em;
          min-height: 1.2em; font-variant-numeric: tabular-nums; }
        .boot-word span { display: inline-block; }
        .boot-word .scrambled { color: rgba(165,180,252,.55); }
        .boot-bar { width: 200px; height: 3px; border-radius: 99px; background: rgba(255,255,255,.12); overflow: hidden; }
        .boot-bar i { display: block; height: 100%; border-radius: 99px;
          background: linear-gradient(90deg,#4353FF,#A5B4FC); transition: width .18s linear; }
        .boot-pct { font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(255,255,255,.45); font-variant-numeric: tabular-nums; }
        @keyframes bootPop { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .boot-mark { animation: none; }
          .boot-bar i { transition: none; }
        }
      `}</style>

      <div className="boot-inner">
        <svg className="boot-mark" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="bootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path d="M25 20V80L45 50L75 80V20L55 50L25 20Z" fill="url(#bootGrad)" />
          <circle cx="25" cy="20" r="5" fill="#a5b4fc" />
          <circle cx="75" cy="80" r="5" fill="#6ee7b7" />
        </svg>

        <div className="boot-word" aria-hidden="true">
          {(text || WORD.replace(/./g, ' ')).split('').map((ch, i) => (
            <span key={i} className={text && ch === WORD[i] ? '' : 'scrambled'}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>

        <div className="boot-bar"><i style={{ width: `${Math.round(progress)}%` }} /></div>
        <div className="boot-pct">Cargando {Math.round(progress)}%</div>
      </div>
    </div>
  )
}
