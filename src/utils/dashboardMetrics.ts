import { format } from 'date-fns'
import type { ParteDeLabores, Tarea } from '../types'

export interface DashboardStats {
  total: number
  finalizadas: number
  enProgreso: number
  personasPorDia: string
  rendimientoPorTarea: number
  /** Suma acumulada de personas-día (cada cierre manual desde campo). */
  personasDias: number
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

/** Agrupa personas por día desde partes de labores cerrados en campo. */
export function aggregateManualStaffingFromPartes(partes: ParteDeLabores[]): DailyManualStaffing[] {
  const byDate = new Map<string, { personas: number; tareas: number }>()

  for (const p of partes) {
    if (p.tipo !== 'manual' || !p.cantidadPersonas || p.cantidadPersonas < 1) continue
    const refTs = p.estado === 'abierto' ? p.abiertoEn : (p.cerradoEn ?? p.abiertoEn)
    if (!refTs?.toDate) continue
    const dayKey = format(refTs.toDate(), 'yyyy-MM-dd')
    const prev = byDate.get(dayKey) ?? { personas: 0, tareas: 0 }
    byDate.set(dayKey, {
      personas: prev.personas + p.cantidadPersonas,
      tareas: prev.tareas + 1,
    })
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }))
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

/** Prefiere partes de labores (fuente campo); fallback a rendimientos en tareas legacy. */
export function resolveManualStaffingByDay(
  manuales: Extract<Tarea, { tipo: 'manual' }>[],
  partes: ParteDeLabores[],
): DailyManualStaffing[] {
  const fromPartes = aggregateManualStaffingFromPartes(partes)
  if (fromPartes.length > 0) return fromPartes
  return aggregateManualStaffingByDay(manuales)
}

export function countDiasConActividad(
  tareas: Tarea[],
  partes: ParteDeLabores[] = [],
): number {
  const manuales = getManuales(tareas)
  const dias = resolveManualStaffingByDay(manuales, partes).length
  return dias || 1
}

export interface PersonasPorDiaResult {
  personasDias: number
  dias: number
  promedio: string
}

/** Personas-día acumuladas y promedio diario (solo tareas manuales / partes campo). */
export function computePersonasPorDia(
  manuales: Extract<Tarea, { tipo: 'manual' }>[],
  partes: ParteDeLabores[] = [],
): PersonasPorDiaResult {
  const daily = resolveManualStaffingByDay(manuales, partes)
  const personasDias = daily.reduce((sum, d) => sum + d.personas, 0)
  const dias = daily.length || 1
  return {
    personasDias,
    dias,
    promedio: dias > 0 ? (personasDias / dias).toFixed(1) : '0',
  }
}

export function computeDashboardStats(
  tareas: Tarea[],
  partes: ParteDeLabores[] = [],
): DashboardStats {
  const finalizadas = getFinalizadas(tareas)
  const enProgreso = getEnProgreso(tareas)
  const manuales = getManuales(tareas)
  const { personasDias, promedio } = computePersonasPorDia(manuales, partes)

  return {
    total: tareas.length,
    finalizadas: finalizadas.length,
    enProgreso: enProgreso.length,
    personasPorDia: promedio,
    rendimientoPorTarea: getConRendimiento(tareas).length,
    personasDias,
  }
}
