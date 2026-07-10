import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ParteDeLabores } from '../types'

export interface DotacionRow {
  id: string
  fecha: string
  fechaLabel: string
  finca: string
  tarea: string
  personas: number
  tipo: 'manual' | 'mecanica'
}

export interface DotacionFincaResumen {
  finca: string
  personas: number
}

export interface DotacionFilters {
  finca: string
  fecha: string
  tarea: string
}

/** Personas que aporta un parte a la dotación (manual: cuadrilla; mecánica: 1 por parte). */
export function personasEnParte(parte: ParteDeLabores): number {
  if (parte.tipo === 'manual') {
    const n = parte.cantidadPersonas ?? 0
    return n >= 1 ? n : 0
  }
  return 1
}

export function isParteValidoDotacion(parte: ParteDeLabores): boolean {
  return personasEnParte(parte) > 0 && !!parte.abiertoEn?.toDate
}

/** Día de dotación: siempre fecha de apertura del parte. */
export function parteDotacionFecha(parte: ParteDeLabores): string {
  return format(parte.abiertoEn.toDate(), 'yyyy-MM-dd')
}

export function localTodayKey(referenceDate = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd')
}

export function parteToDotacionRow(parte: ParteDeLabores): DotacionRow | null {
  if (!isParteValidoDotacion(parte)) return null
  const fecha = parteDotacionFecha(parte)
  return {
    id: parte.id,
    fecha,
    fechaLabel: format(new Date(`${fecha}T12:00:00`), 'dd/MM/yyyy', { locale: es }),
    finca: parte.fincaNombre,
    tarea: parte.tarea,
    personas: personasEnParte(parte),
    tipo: parte.tipo,
  }
}

export function buildDotacionRows(partes: ParteDeLabores[]): DotacionRow[] {
  return partes
    .map(parteToDotacionRow)
    .filter((r): r is DotacionRow => r !== null)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.finca.localeCompare(b.finca))
}

export function filterDotacionRows(
  rows: DotacionRow[],
  filters: DotacionFilters,
): DotacionRow[] {
  return rows.filter(row => {
    if (filters.finca !== 'todas' && row.finca !== filters.finca) return false
    if (filters.fecha && row.fecha !== filters.fecha) return false
    if (filters.tarea !== 'todas' && row.tarea !== filters.tarea) return false
    return true
  })
}

export function listDotacionFincas(partes: ParteDeLabores[]): string[] {
  return [...new Set(buildDotacionRows(partes).map(r => r.finca))].sort()
}

export function listDotacionTareas(partes: ParteDeLabores[]): string[] {
  return [...new Set(buildDotacionRows(partes).map(r => r.tarea))].sort()
}

export function computeDotacionTotal(rows: DotacionRow[]): number {
  return rows.reduce((sum, r) => sum + r.personas, 0)
}

export function computeDotacionHoy(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): number {
  const hoy = localTodayKey(referenceDate)
  return computeDotacionTotal(buildDotacionRows(partes).filter(r => r.fecha === hoy))
}

/** Suma de personas por finca para una fecha. */
export function computeDotacionPorFinca(
  partes: ParteDeLabores[],
  fecha: string,
): DotacionFincaResumen[] {
  const byFinca = new Map<string, number>()
  for (const row of buildDotacionRows(partes)) {
    if (row.fecha !== fecha) continue
    byFinca.set(row.finca, (byFinca.get(row.finca) ?? 0) + row.personas)
  }
  return [...byFinca.entries()]
    .map(([finca, personas]) => ({ finca, personas }))
    .sort((a, b) => a.finca.localeCompare(b.finca))
}

/** Promedio de personas por día con actividad (todas las fechas). */
export function computeDotacionPromedioDiario(partes: ParteDeLabores[]): string {
  const byDate = new Map<string, number>()
  for (const row of buildDotacionRows(partes)) {
    byDate.set(row.fecha, (byDate.get(row.fecha) ?? 0) + row.personas)
  }
  const dias = byDate.size
  if (dias === 0) return '0'
  const total = [...byDate.values()].reduce((sum, n) => sum + n, 0)
  return (total / dias).toFixed(1)
}

/** Agrupa dotación por día (manual + mecánica) para gráficos de analytics. */
export function aggregateStaffingFromPartes(
  partes: ParteDeLabores[],
): { fecha: string; personas: number; tareas: number }[] {
  const byDate = new Map<string, { personas: number; tareas: number }>()
  for (const row of buildDotacionRows(partes)) {
    const prev = byDate.get(row.fecha) ?? { personas: 0, tareas: 0 }
    byDate.set(row.fecha, {
      personas: prev.personas + row.personas,
      tareas: prev.tareas + 1,
    })
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, v]) => ({ fecha, ...v }))
}

export function formatDotacionFincaResumen(resumen: DotacionFincaResumen[]): string {
  if (resumen.length === 0) return 'Sin dotación registrada para esta fecha'
  return resumen.map(r => `${r.finca}: ${r.personas}`).join(' · ')
}

export function isDotacionFechaHoy(fecha: string, referenceDate = new Date()): boolean {
  return fecha === localTodayKey(referenceDate)
}

export function formatDotacionFechaLabel(fecha: string, referenceDate = new Date()): string {
  const d = new Date(`${fecha}T12:00:00`)
  if (isSameDay(d, referenceDate)) return 'hoy'
  return format(d, "d 'de' MMMM yyyy", { locale: es })
}
