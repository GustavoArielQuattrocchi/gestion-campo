export interface OrdenOcRef {
  oc: string
  finca: string
}

/**
 * Genera el próximo N° de OC con formato `OC-{FINCA}-{AAAA}-{NNNN}`.
 * El contador es independiente por finca y se reinicia cada año.
 */
export function generateOcNumber(
  existing: OrdenOcRef[],
  finca: string,
  now: Date = new Date(),
): string {
  const fincaKey = finca.trim()
  if (!fincaKey) return ''

  const year = now.getFullYear()
  const prefix = `OC-${fincaKey}-${year}-`
  let max = 0

  for (const orden of existing) {
    if (orden.finca.trim() !== fincaKey) continue
    if (!orden.oc.startsWith(prefix)) continue
    const n = Number.parseInt(orden.oc.slice(prefix.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }

  return `${prefix}${String(max + 1).padStart(4, '0')}`
}
