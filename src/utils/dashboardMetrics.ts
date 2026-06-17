import { format } from 'date-fns'
import type { Tarea } from '../types'

export interface DashboardStats {
  total: number
  finalizadas: number
  enProgreso: number
  personasPorDia: string
  rendimientoPorTarea: number
  totalPersonas: number
}

export function getFinalizadas(tareas: Tarea[]): Tarea[] {
  return tareas.filter(t => t.estado === 'finalizada')
}

export function getEnProgreso(tareas: Tarea[]): Tarea[] {
  return tareas.filter(t => t.estado === 'en_progreso')
}

export function getManuales(tareas: Tarea[]): Extract<Tarea, { tipo: 'manual' }>[] {
  return tareas.filter((t): t is Extract<Tarea, { tipo: 'manual' }> => t.tipo === 'manual')
}

export function getConRendimiento(tareas: Tarea[]): Tarea[] {
  return getFinalizadas(tareas).filter(t => Boolean(t.rendimiento?.trim()))
}

export function countDiasConActividad(tareas: Tarea[]): number {
  const fechas = new Set(
    tareas
      .filter(t => t.fechaInicio?.toDate)
      .map(t => format(t.fechaInicio!.toDate(), 'yyyy-MM-dd')),
  )
  return fechas.size || 1
}

export interface PersonasPorDiaResult {
  totalPersonas: number
  dias: number
  promedio: string
}

/** Promedio de personas/día basado solo en tareas manuales (tarjeta y modal usan esto). */
export function computePersonasPorDia(
  manuales: Extract<Tarea, { tipo: 'manual' }>[],
): PersonasPorDiaResult {
  const totalPersonas = manuales.reduce((sum, t) => sum + (t.cantidadPersonas || 0), 0)
  const dias = countDiasConActividad(manuales)
  return {
    totalPersonas,
    dias,
    promedio: dias > 0 ? (totalPersonas / dias).toFixed(1) : '0',
  }
}

export function computeDashboardStats(tareas: Tarea[]): DashboardStats {
  const finalizadas = getFinalizadas(tareas)
  const enProgreso = getEnProgreso(tareas)
  const manuales = getManuales(tareas)
  const { totalPersonas, promedio } = computePersonasPorDia(manuales)

  return {
    total: tareas.length,
    finalizadas: finalizadas.length,
    enProgreso: enProgreso.length,
    personasPorDia: promedio,
    rendimientoPorTarea: getConRendimiento(tareas).length,
    totalPersonas,
  }
}
