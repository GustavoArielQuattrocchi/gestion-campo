/**
 * Cálculo del "factor" de máquina y de la dosis maquinada.
 * (Inferido: factor = volumen de tanque / volumen de aplicación; el script.js
 * original no estaba disponible.)
 */

/** Devuelve el factor (L tanque / L por ha) o null si no es calculable. */
export function computeFactor(
  volMaquinaria: number,
  volAplicacion: number,
): number | null {
  if (!Number.isFinite(volMaquinaria) || !Number.isFinite(volAplicacion)) return null
  if (volAplicacion <= 0) return null
  return volMaquinaria / volAplicacion
}

/** Extrae el primer número de un texto (admite coma decimal). */
export function parseLeadingNumber(value: string): number | null {
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

/** Formatea un número quitando ceros finales (hasta 3 decimales). */
export function formatNumber(value: number): string {
  return Number.parseFloat(value.toFixed(3)).toString()
}

/** Calcula la dosis maquinada (dosis/ha × factor) como texto, o '' si no aplica. */
export function computeDosisMaquinada(dosisHa: string, factor: number | null): string {
  if (factor === null) return ''
  const dosis = parseLeadingNumber(dosisHa)
  if (dosis === null) return ''
  return formatNumber(dosis * factor)
}

/** Texto para el chip de factor. */
export function formatFactor(factor: number | null): string {
  return factor === null ? '—' : factor.toFixed(2)
}
