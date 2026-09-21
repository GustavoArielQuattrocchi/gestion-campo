import { format } from 'date-fns'
import type { ParteDeLabores, RendimientoDiario, Tarea } from '../types'
import { localTodayKey, parteDotacionFecha } from './dotacion'
import { esTareaTodaLaFinca } from './tareaAlcance'

export const MAP_TAREA_TODAS = 'todas'

export type MapFechaModo = 'dia' | 'rango' | 'todas'

export interface MapFechaFilter {
  modo: MapFechaModo
  /** yyyy-MM-dd cuando modo === 'dia' */
  fecha?: string
  /** yyyy-MM-dd cuando modo === 'rango' */
  desde?: string
  hasta?: string
}

export interface MapFechaScope {
  tareas: Tarea[]
  parteIds: Set<string>
}

export function defaultMapFechaFilter(now = new Date()): MapFechaFilter {
  return { modo: 'dia', fecha: localTodayKey(now) }
}

/** Labores únicas disponibles para el filtro del mapa (según tareas ya filtradas por finca/tipo/estado). */
export function listMapTareasDisponibles(tareas: Tarea[]): string[] {
  return [...new Set(
    tareas.filter(t => !esTareaTodaLaFinca(t)).map(t => t.tarea).filter(Boolean),
  )].sort((a, b) => a.localeCompare(b))
}

/** Filtra tareas para colorear el mapa; no afecta sidebar ni métricas. */
export function filterTareasForMap(tareas: Tarea[], filtroTarea: string): Tarea[] {
  const conCuadros = tareas.filter(t => !esTareaTodaLaFinca(t))
  if (filtroTarea === MAP_TAREA_TODAS) return conCuadros
  return conCuadros.filter(t => t.tarea === filtroTarea)
}

export function normalizeMapTareaParam(
  value: string | null,
  disponibles: string[],
): string {
  if (!value || value === MAP_TAREA_TODAS) return MAP_TAREA_TODAS
  return disponibles.includes(value) ? value : MAP_TAREA_TODAS
}

export function fechaKeyMatchesMapFilter(
  fechaKey: string | null,
  filtro: MapFechaFilter,
): boolean {
  if (filtro.modo === 'todas') return true
  if (!fechaKey) return false
  if (filtro.modo === 'dia') return !!filtro.fecha && fechaKey === filtro.fecha
  const desde = filtro.desde ?? ''
  const hasta = filtro.hasta ?? ''
  if (!desde && !hasta) return true
  if (desde && fechaKey < desde) return false
  if (hasta && fechaKey > hasta) return false
  return true
}

export function parteCoincideFechaMapa(
  parte: ParteDeLabores,
  filtro: MapFechaFilter,
): boolean {
  if (!parte.abiertoEn?.toDate) return false
  return fechaKeyMatchesMapFilter(parteDotacionFecha(parte), filtro)
}

function timestampToDayKey(value: { toDate?: () => Date } | undefined): string | null {
  if (!value?.toDate) return null
  return format(value.toDate(), 'yyyy-MM-dd')
}

/** Rendimiento del mapa: parte de la jornada, o fecha del registro si no hay parteId. */
export function rendimientoCoincideFechaMapa(
  rd: Pick<RendimientoDiario, 'fecha' | 'parteId'>,
  filtro: MapFechaFilter,
  parteIds: Set<string>,
): boolean {
  if (filtro.modo === 'todas') return true
  if (rd.parteId) return parteIds.has(rd.parteId)
  return fechaKeyMatchesMapFilter(timestampToDayKey(rd.fecha), filtro)
}

/**
 * Recorta tareas a las que tienen partes en el período y, si el parte trae cuadros,
 * pinta solo esos (no toda la tarea de varios días).
 */
export function filterTareasByMapFecha(
  tareas: Tarea[],
  partes: ParteDeLabores[],
  filtro: MapFechaFilter,
): MapFechaScope {
  if (filtro.modo === 'todas') {
    return { tareas, parteIds: new Set(partes.map(p => p.id)) }
  }

  const scopeByTarea = new Map<string, { cuadroIds: Set<string>; cuadros: Set<string> }>()
  const parteIds = new Set<string>()

  for (const parte of partes) {
    if (!parteCoincideFechaMapa(parte, filtro)) continue
    parteIds.add(parte.id)
    if (!parte.tareaId) continue
    const entry = scopeByTarea.get(parte.tareaId) ?? {
      cuadroIds: new Set<string>(),
      cuadros: new Set<string>(),
    }
    for (const id of parte.cuadroIds ?? []) {
      if (id) entry.cuadroIds.add(id)
    }
    for (const nombre of parte.cuadros ?? []) {
      if (nombre) entry.cuadros.add(nombre)
    }
    scopeByTarea.set(parte.tareaId, entry)
  }

  const scoped = tareas.flatMap(tarea => {
    const scope = scopeByTarea.get(tarea.id)
    if (!scope) return []
    if (scope.cuadroIds.size === 0 && scope.cuadros.size === 0) return [tarea]
    return [{
      ...tarea,
      cuadroIds: [...scope.cuadroIds],
      cuadros: [...scope.cuadros],
    }]
  })

  return { tareas: scoped, parteIds }
}
