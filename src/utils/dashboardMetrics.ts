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
  return tareas.filter(
    t => Boolean(t.rendimiento?.trim()) || (t.rendimientosDiarios?.length ?? 0) > 0,
  )
}

export interface DailyManualStaffing {
  fecha: string
  personas: number
  tareas: number
}

/** Agrupa dotación manual por día real de actividad (cierres diarios o fecha de inicio legacy). */
export function aggregateManualStaffingByDay(
  manuales: Extract<Tarea, { tipo: 'manual' }>[],
): DailyManualStaffing[] {
  const byDate = new Map<string, { personas: number; tareas: number }>()

  for (const t of manuales) {
    const addDay = (dayKey: string, personas: number) => {
      const prev = byDate.get(dayKey) ?? { personas: 0, tareas: 0 }
      byDate.set(dayKey, {
        personas: prev.personas + personas,
        tareas: prev.tareas + 1,
      })
    }

    if (t.rendimientosDiarios && t.rendimientosDiarios.length > 0) {
      const daysSeen = new Set<string>()
      for (const rd of t.rendimientosDiarios) {
        if (!rd.fecha?.toDate) continue
        const dayKey = format(rd.fecha.toDate(), 'yyyy-MM-dd')
        if (daysSeen.has(dayKey)) continue
        daysSeen.add(dayKey)
        addDay(dayKey, t.cantidadPersonas || 0)
      }
    } else if (t.fechaInicio?.toDate) {
      addDay(format(t.fechaInicio.toDate(), 'yyyy-MM-dd'), t.cantidadPersonas || 0)
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }))
}

export function countDiasConActividad(tareas: Tarea[]): number {
  const manuales = getManuales(tareas)
  const dias = aggregateManualStaffingByDay(manuales).length
  return dias || 1
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
  const daily = aggregateManualStaffingByDay(manuales)
  const totalPersonas = manuales.reduce((sum, t) => sum + (t.cantidadPersonas || 0), 0)
  const dias = daily.length || 1
  const sumDailyHeadcount = daily.reduce((sum, d) => sum + d.personas, 0)
  return {
    totalPersonas,
    dias,
    promedio: dias > 0 ? (sumDailyHeadcount / dias).toFixed(1) : '0',
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
