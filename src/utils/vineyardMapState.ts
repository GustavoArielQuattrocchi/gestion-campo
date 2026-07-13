import type { Tarea } from '../types'
import { buildNombreToIdMap } from '../data/mapaData'

export interface CuadroEstadoMapa {
  tareasEnProgreso: Tarea[]
  tareasCerradas: Tarea[]
  pendiente: boolean
  cuadroFinalizado: boolean
}

/** Agrupa tareas por cuadro para colorear el mapa y el panel lateral. */
export function buildEstadoPorCuadro(tareas: Tarea[]): Map<string, CuadroEstadoMapa> {
  const map = new Map<string, CuadroEstadoMapa>()
  const mappersPorFinca = new Map<string, Map<string, string>>()

  for (const tarea of tareas) {
    const fincaNombre = tarea.fincaNombre
    if (!fincaNombre) continue

    const cuadroIds = new Set<string>()
    for (const id of tarea.cuadroIds ?? []) {
      if (id) cuadroIds.add(id)
    }

    if ((tarea.cuadros ?? []).length > 0) {
      if (!mappersPorFinca.has(fincaNombre)) {
        mappersPorFinca.set(fincaNombre, buildNombreToIdMap(fincaNombre))
      }
      const mapper = mappersPorFinca.get(fincaNombre)!
      for (const cuadroNombre of tarea.cuadros ?? []) {
        const cuadroId = mapper.get(cuadroNombre)
        if (cuadroId) cuadroIds.add(cuadroId)
      }
    }

    for (const cuadroId of cuadroIds) {
      if (!map.has(cuadroId)) {
        map.set(cuadroId, {
          tareasEnProgreso: [],
          tareasCerradas: [],
          pendiente: false,
          cuadroFinalizado: false,
        })
      }
      const entry = map.get(cuadroId)!
      if (tarea.estado === 'en_progreso') {
        entry.tareasEnProgreso.push(tarea)
        const finalizados = new Set(tarea.cuadroIdsFinalizados ?? [])
        if (finalizados.has(cuadroId)) {
          entry.cuadroFinalizado = true
        } else {
          entry.pendiente = true
        }
      } else {
        entry.tareasCerradas.push(tarea)
        entry.cuadroFinalizado = true
      }
    }
  }

  return map
}

/** IDs de cuadro con la labor del filtro activo en el mapa. */
export function collectCuadroIdsFromTareas(tareas: Tarea[]): Set<string> {
  const ids = new Set<string>()
  const mappersPorFinca = new Map<string, Map<string, string>>()

  for (const tarea of tareas) {
    const fincaNombre = tarea.fincaNombre
    if (!fincaNombre) continue

    for (const id of tarea.cuadroIds ?? []) {
      if (id) ids.add(id)
    }

    if ((tarea.cuadros ?? []).length > 0) {
      if (!mappersPorFinca.has(fincaNombre)) {
        mappersPorFinca.set(fincaNombre, buildNombreToIdMap(fincaNombre))
      }
      const mapper = mappersPorFinca.get(fincaNombre)!
      for (const cuadroNombre of tarea.cuadros ?? []) {
        const cuadroId = mapper.get(cuadroNombre)
        if (cuadroId) ids.add(cuadroId)
      }
    }
  }

  return ids
}
