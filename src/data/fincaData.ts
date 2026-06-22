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

export function getTotalHectareasFinca(fincaId: string): number {
  const cuadros = BASE_DATOS_FINCAS[fincaId]
  if (!cuadros) return 0
  return cuadros.reduce((sum, c) => sum + c.hectareas, 0)
}

export function getHectareasCuadro(fincaId: string, cuadroId: string): number {
  const cuadros = BASE_DATOS_FINCAS[fincaId]
  if (!cuadros) return 0
  return cuadros.find(c => c.id === cuadroId)?.hectareas ?? 0
}

export function getNombreCuadro(fincaId: string, cuadroId: string): string {
  const cuadros = BASE_DATOS_FINCAS[fincaId]
  if (!cuadros) return cuadroId
  return cuadros.find(c => c.id === cuadroId)?.nombre ?? cuadroId
}

