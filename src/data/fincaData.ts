import { BASE_DATOS_FINCAS } from './fincas'
import type { Cuadro, Finca } from '../types'

export interface CuadroDetalle extends Cuadro {
  variedad: string
  vinedo: string
  hectareas: number
  finca: string
}

export const fincas: Finca[] = Object.keys(BASE_DATOS_FINCAS).map(nombre => ({
  id: nombre,
  nombre,
}))

export function getCuadrosPorFinca(fincaNombre: string): CuadroDetalle[] {
  const cuadros = BASE_DATOS_FINCAS[fincaNombre]
  if (!cuadros) return []
  return cuadros.map(cuadro => ({ ...cuadro, finca: fincaNombre }))
}

