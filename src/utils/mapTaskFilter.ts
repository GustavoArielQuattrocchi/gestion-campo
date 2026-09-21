import type { Tarea } from '../types'
import { esTareaTodaLaFinca } from './tareaAlcance'

export const MAP_TAREA_TODAS = 'todas'

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
