import type { CuadroDetalle } from '../data/fincaData'
import { getCuadroDetalle, getCuadroDetalleById } from '../data/fincaData'

const DEFAULT_ORIGIN = 'https://gestion-campo-ffe2d.web.app'

/** URL pública que codifica el QR de un cuadro. */
export function buildCuadroQrUrl(fincaId: string, cuadroId: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN)
  return `${base}/cuadro/${encodeURIComponent(fincaId)}/${encodeURIComponent(cuadroId)}`
}

export function getCuadroPublicInfo(fincaId: string, cuadroId: string): CuadroDetalle | null {
  const decodedFinca = decodeURIComponent(fincaId)
  const decodedCuadro = decodeURIComponent(cuadroId)
  return getCuadroDetalle(decodedFinca, decodedCuadro) ?? getCuadroDetalleById(decodedCuadro)
}

export function formatHectareas(ha: number): string {
  return `${ha.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
}
