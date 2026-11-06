// Paginación transparente para PostgREST.
// Supabase devuelve como máximo 1.000 filas por request (y este proyecto tiene
// los agregados deshabilitados), así que para contar o sumar de verdad hay que
// pedir todas las páginas.

const PAGE_SIZE = 1000
const MAX_PAGES = 20 // 20.000 filas: techo de seguridad para no colgar la vista

/**
 * @param {object} supabase  cliente de Supabase
 * @param {string} table     tabla
 * @param {string} columns   columnas a traer (evita `*`)
 * @param {(q:any)=>any} apply  aplica filtros y orden; se llama para cada página
 * @returns {Promise<{rows:any[], total:number, truncated:boolean}>}
 */
export async function fetchAll(supabase, table, columns, apply) {
  // 1. total exacto sin traer filas
  const countQuery = apply(supabase.from(table).select('*', { count: 'exact', head: true }))
  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const total = count || 0
  if (total === 0) return { rows: [], total: 0, truncated: false }

  const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES)

  // 2. todas las páginas en paralelo
  const requests = Array.from({ length: pages }, (_, i) =>
    apply(supabase.from(table).select(columns))
      .range(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE - 1)
  )

  const results = await Promise.all(requests)
  const error = results.find(r => r.error)?.error
  if (error) throw error

  const rows = results.flatMap(r => r.data || [])
  return { rows, total, truncated: total > pages * PAGE_SIZE }
}

export default fetchAll
