import { formatNumber, parseLeadingNumber } from '../../ordenesCura/utils/factor'

/**
 * Dosis de la aplicación = dosis/ha × superficie (ha).
 * Un decimal, el mismo `formatNumber` que la dosis maquinada de la OC.
 * Vacío si falta dosis/ha o superficie.
 */
export function computeDosisAplicacion(dosisHa: string, superficie: string): string {
  if (!dosisHa.trim() || !superficie.trim()) return ''
  const dosis = parseLeadingNumber(dosisHa)
  const hectareas = parseLeadingNumber(superficie)
  if (dosis === null || hectareas === null) return ''
  return formatNumber(dosis * hectareas)
}
