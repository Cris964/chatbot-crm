// Formato único de moneda y números para todo el CRM.
// Regla: pesos colombianos con punto de miles y sin decimales.
// Para espacios cortos (KPIs, ejes) usar moneyCompact.

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Convierte a número cualquier valor que venga de la base o de un input.
 * Acepta 12210000, "12210000", "12.210.000", "$ 12.210.000", "12.210.000,50".
 */
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const cleaned = String(value)
    .replace(/[^\d.,-]/g, '')
    .trim()

  if (!cleaned) return 0

  const hasComma = cleaned.includes(',')
  const dots = (cleaned.match(/\./g) || []).length
  let normalized = cleaned

  if (hasComma) {
    // Formato colombiano: 1.234.567,89
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (dots > 1) {
    // Solo puntos como separador de miles: 1.234.567
    normalized = cleaned.replace(/\./g, '')
  } else if (dots === 1) {
    const decimals = cleaned.split('.')[1] || ''
    // 12.210 se lee como miles; 12.21 como decimal
    if (decimals.length === 3) normalized = cleaned.replace('.', '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/** $12.210.000 */
export function money(value) {
  return COP.format(toNumber(value))
}

/** $695,4 M · $8,0 M · $950 mil — para KPIs y ejes de gráficas. */
export function moneyCompact(value) {
  const n = toNumber(value)
  const abs = Math.abs(n)

  if (abs >= 1_000_000_000) {
    return `$${(n / 1_000_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MM`
  }
  if (abs >= 1_000_000) {
    return `$${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
  }
  if (abs >= 1_000) {
    return `$${(n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} mil`
  }
  return money(n)
}

/** 1.247 — separador de miles para cantidades. */
export function count(value) {
  return Math.round(toNumber(value)).toLocaleString('es-CO')
}

/** 42,5% */
export function percent(value, decimals = 1) {
  const n = toNumber(value)
  return `${n.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}%`
}

/** 25/10/2026 */
export function shortDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default { toNumber, money, moneyCompact, count, percent, shortDate }
