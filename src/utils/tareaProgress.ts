import { buildNombreToIdMap } from '../data/mapaData'
import { getHectareasCuadro, getTotalHectareasFinca } from '../data/fincaData'
import type { Tarea } from '../types'

export interface TareaProgress {
  /** Porcentaje 0–100 sobre el total de hectáreas de la finca. */
  porcentaje: number
  hectareasFinalizadas: number
  hectareasFinca: number
  cuadrosPendientes: string[]
  cuadrosFinalizados: string[]
}

/** Resuelve IDs de cuadro de una tarea (catálogo o nombres legacy). */
export function resolveTaskCuadroIds(tarea: Tarea): string[] {
  if (tarea.cuadroIds?.length) return tarea.cuadroIds
  const map = buildNombreToIdMap(tarea.fincaNombre)
  return (tarea.cuadros ?? [])
    .map(nombre => map.get(nombre))
    .filter((id): id is string => Boolean(id))
}

export function computeTareaProgress(tarea: Tarea): TareaProgress {
  const taskCuadroIds = resolveTaskCuadroIds(tarea)
  const finalizadosSet = new Set(tarea.cuadroIdsFinalizados ?? [])
  const cuadrosFinalizados = taskCuadroIds.filter(id => finalizadosSet.has(id))
  const cuadrosPendientes = taskCuadroIds.filter(id => !finalizadosSet.has(id))

  const hectareasFinalizadas = cuadrosFinalizados.reduce(
    (sum, id) => sum + getHectareasCuadro(tarea.fincaId, id),
    0,
  )
  const hectareasFinca = getTotalHectareasFinca(tarea.fincaId)
  const porcentaje =
    hectareasFinca > 0
      ? Math.min(100, Math.round((hectareasFinalizadas / hectareasFinca) * 1000) / 10)
      : 0

  return {
    porcentaje,
    hectareasFinalizadas,
    hectareasFinca,
    cuadrosPendientes,
    cuadrosFinalizados,
  }
}

export function allCuadrosTareaFinalizados(tarea: Tarea): boolean {
  const taskCuadroIds = resolveTaskCuadroIds(tarea)
  if (taskCuadroIds.length === 0) return false
  const finalizadosSet = new Set(tarea.cuadroIdsFinalizados ?? [])
  return taskCuadroIds.every(id => finalizadosSet.has(id))
}

export function formatProgressLabel(progress: TareaProgress): string {
  return `${progress.porcentaje}% · ${progress.hectareasFinalizadas.toFixed(1)} / ${progress.hectareasFinca.toFixed(1)} ha`
}
