import type { Tarea } from '../types'
import { buildNombreToIdMap } from '../data/mapaData'

/** IDs de cuadro asociados a una tarea (por id o por nombre legacy). */
export function getCuadroIdsFromTarea(tarea: Tarea): Set<string> {
  const ids = new Set<string>()
  for (const id of tarea.cuadroIds ?? []) {
    if (id) ids.add(id)
  }
  if ((tarea.cuadros ?? []).length > 0 && tarea.fincaNombre) {
    const mapper = buildNombreToIdMap(tarea.fincaNombre)
    for (const nombre of tarea.cuadros) {
      const id = mapper.get(nombre)
      if (id) ids.add(id)
    }
  }
  return ids
}

export function tareaIncluyeCuadro(tarea: Tarea, fincaId: string, cuadroId: string): boolean {
  const fincaMatch = tarea.fincaId === fincaId || tarea.fincaNombre === fincaId
  if (!fincaMatch) return false
  return getCuadroIdsFromTarea(tarea).has(cuadroId)
}

export function filterTareasPorCuadro(tareas: Tarea[], fincaId: string, cuadroId: string): Tarea[] {
  return tareas.filter(t => tareaIncluyeCuadro(t, fincaId, cuadroId))
}

/** Quién ejecuta la tarea: cuadrilla (propia/externa) o operario mecánico. */
export function formatTareaEjecutor(tarea: Tarea): string {
  if (tarea.tipo === 'manual') {
    const nombre = tarea.cuadrilla.trim().toLowerCase()
    if (nombre.includes('extern')) return 'Cuadrilla externa'
    if (nombre.includes('propia')) return 'Cuadrilla propia'
    return tarea.cuadrilla
  }
  return tarea.persona?.trim() || '—'
}

export interface CuadroTareasAgrupadas {
  enProgreso: Tarea[]
  finalizadas: Tarea[]
}

export function agruparTareasCuadro(tareas: Tarea[]): CuadroTareasAgrupadas {
  const enProgreso: Tarea[] = []
  const finalizadas: Tarea[] = []
  for (const t of tareas) {
    if (t.estado === 'finalizada') finalizadas.push(t)
    else enProgreso.push(t)
  }
  const byFecha = (a: Tarea, b: Tarea) => {
    const ta = a.fechaInicio?.toDate?.()?.getTime() ?? 0
    const tb = b.fechaInicio?.toDate?.()?.getTime() ?? 0
    return tb - ta
  }
  enProgreso.sort(byFecha)
  finalizadas.sort((a, b) => {
    const ta = a.fechaFin?.toDate?.()?.getTime() ?? a.fechaInicio?.toDate?.()?.getTime() ?? 0
    const tb = b.fechaFin?.toDate?.()?.getTime() ?? b.fechaInicio?.toDate?.()?.getTime() ?? 0
    return tb - ta
  })
  return { enProgreso, finalizadas }
}

export function cuadroFinalizadoEnTarea(tarea: Tarea, cuadroId: string): boolean {
  return (tarea.cuadroIdsFinalizados ?? []).includes(cuadroId)
}
