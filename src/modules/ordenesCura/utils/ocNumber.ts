export interface OrdenNumeroRef {
  codigo: string
  finca: string
}

export type OrdenNumeroPrefix = 'OC' | 'OF'

export interface OrdenOcRef {
  oc: string
  finca: string
}

/** Entero final de un código OC- u OF- de esa finca y año, o null si no corresponde. */
function secuenciaCompartida(codigo: string, fincaKey: string, year: number): number | null {
  const trimmed = codigo.trim()
  if (!trimmed.startsWith('OC-') && !trimmed.startsWith('OF-')) return null
  const body = trimmed.slice(3)
  const tail = `${fincaKey}-${year}-`
  if (!body.startsWith(tail)) return null
  const n = Number.parseInt(body.slice(tail.length), 10)
  return Number.isFinite(n) ? n : null
}

/**
 * Próximo número `{prefijo}-{FINCA}-{AAAA}-{NNNN}`.
 * El entero se comparte por finca y año entre órdenes de cura (OC) y de
 * fertilización (OF): se ignora el prefijo y se usa el máximo + 1.
 */
export function generateOrdenNumber(
  existing: OrdenNumeroRef[],
  finca: string,
  prefix: OrdenNumeroPrefix,
  now: Date = new Date(),
): string {
  const fincaKey = finca.trim()
  if (!fincaKey) return ''

  const year = now.getFullYear()
  let max = 0

  for (const orden of existing) {
    if (orden.finca.trim() !== fincaKey) continue
    const n = secuenciaCompartida(orden.codigo, fincaKey, year)
    if (n !== null && n > max) max = n
  }

  return `${prefix}-${fincaKey}-${year}-${String(max + 1).padStart(4, '0')}`
}

/**
 * Próximo N° de OC. Si `existing` incluye códigos OF de la misma finca y año,
 * entran en el mismo correlativo.
 */
export function generateOcNumber(
  existing: OrdenOcRef[],
  finca: string,
  now: Date = new Date(),
): string {
  return generateOrdenNumber(
    existing.map(orden => ({ codigo: orden.oc, finca: orden.finca })),
    finca,
    'OC',
    now,
  )
}
