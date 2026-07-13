import { getHectareasCuadro } from '../data/fincaData'
import type { ParteDeLabores, Tarea } from '../types'
import { resolveTaskCuadroIds } from './tareaProgress'
import {
  getEjecutorForCuadro,
  getEjecutorLabelFromParte,
} from './tareaEjecutor'

export interface EjecutorBreakdownRow {
  ejecutor: string
  cuadroIds: string[]
  cuadrosFinalizados: number
  cuadrosPendientes: number
  hectareasFinalizadas: number
  hectareasAsignadas: number
  partesCount: number
}

function partesDeTarea(tarea: Tarea, partes: ParteDeLabores[]): ParteDeLabores[] {
  return partes.filter(p => p.tareaId === tarea.id)
}

export function computeEjecutorBreakdown(
  tarea: Tarea,
  partes: ParteDeLabores[],
): EjecutorBreakdownRow[] {
  const taskCuadroIds = resolveTaskCuadroIds(tarea)
  const finalizadosSet = new Set(tarea.cuadroIdsFinalizados ?? [])
  const partesTarea = partesDeTarea(tarea, partes)

  const byEjecutor = new Map<string, Set<string>>()
  for (const cuadroId of taskCuadroIds) {
    const ejecutor = getEjecutorForCuadro(tarea, cuadroId)
    const set = byEjecutor.get(ejecutor) ?? new Set<string>()
    set.add(cuadroId)
    byEjecutor.set(ejecutor, set)
  }

  const partesPorEjecutor = new Map<string, number>()
  for (const parte of partesTarea) {
    const label = getEjecutorLabelFromParte(parte)
    partesPorEjecutor.set(label, (partesPorEjecutor.get(label) ?? 0) + 1)
  }

  const rows: EjecutorBreakdownRow[] = []

  for (const [ejecutor, cuadroSet] of byEjecutor) {
    const cuadroIds = [...cuadroSet].sort()
    const cuadrosFinalizados = cuadroIds.filter(id => finalizadosSet.has(id)).length
    const cuadrosPendientes = cuadroIds.length - cuadrosFinalizados
    const hectareasAsignadas = cuadroIds.reduce(
      (sum, id) => sum + getHectareasCuadro(tarea.fincaId, id),
      0,
    )
    const hectareasFinalizadas = cuadroIds
      .filter(id => finalizadosSet.has(id))
      .reduce((sum, id) => sum + getHectareasCuadro(tarea.fincaId, id), 0)

    rows.push({
      ejecutor,
      cuadroIds,
      cuadrosFinalizados,
      cuadrosPendientes,
      hectareasFinalizadas,
      hectareasAsignadas,
      partesCount: partesPorEjecutor.get(ejecutor) ?? 0,
    })
  }

  for (const [ejecutor, count] of partesPorEjecutor) {
    if (!byEjecutor.has(ejecutor)) {
      rows.push({
        ejecutor,
        cuadroIds: [],
        cuadrosFinalizados: 0,
        cuadrosPendientes: 0,
        hectareasFinalizadas: 0,
        hectareasAsignadas: 0,
        partesCount: count,
      })
    }
  }

  return rows.sort((a, b) => a.ejecutor.localeCompare(b.ejecutor, 'es'))
}

export function hasMultipleEjecutores(tarea: Tarea): boolean {
  const labels = new Set(
    resolveTaskCuadroIds(tarea).map(id => getEjecutorForCuadro(tarea, id)),
  )
  return labels.size > 1
}
