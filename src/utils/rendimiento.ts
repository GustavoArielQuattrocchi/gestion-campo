import type { RendimientoUnidad } from '../types'
import { RENDIMIENTO_UNIDADES } from '../types'

/** Arma el texto legible del rendimiento (ej. "12 jornal"). */
export function formatRendimiento(cantidad: number, unidad: RendimientoUnidad): string {
  return `${cantidad} ${unidad}`
}

export function isRendimientoUnidad(value: unknown): value is RendimientoUnidad {
  return typeof value === 'string' && (RENDIMIENTO_UNIDADES as string[]).includes(value)
}
