import type { Tarea } from '../types'
import { buildNombreToIdMap } from '../data/mapaData'
import { filterTareasForMap } from './mapTaskFilter'

export interface CuadroEstadoMapa {
  tareasEnProgreso: Tarea[]
  tareasCerradas: Tarea[]
  pendiente: boolean
  cuadroFinalizado: boolean
  /** ≥2 nombres de labor distintos en el cuadro (abiertas o cerradas). */
  multiplesLabores: boolean
}

/** Agrupa tareas por cuadro para colorear el mapa y el panel lateral. */
export function buildEstadoPorCuadro(tareas: Tarea[]): Map<string, CuadroEstadoMapa> {
  const map = new Map<string, CuadroEstadoMapa>()
  const mappersPorFinca = new Map<string, Map<string, string>>()
  const laboresPorCuadro = new Map<string, Set<string>>()

  for (const tarea of tareas) {
    const fincaNombre = tarea.fincaNombre
    if (!fincaNombre) continue

    const laborNombre = tarea.tarea.trim()
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
          multiplesLabores: false,
        })
      }
      const entry = map.get(cuadroId)!
      if (laborNombre) {
        const labores = laboresPorCuadro.get(cuadroId) ?? new Set<string>()
        labores.add(laborNombre.toLowerCase())
        laboresPorCuadro.set(cuadroId, labores)
      }
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

  for (const [cuadroId, entry] of map) {
    entry.multiplesLabores = (laboresPorCuadro.get(cuadroId)?.size ?? 0) > 1
  }

  return map
}

/**
 * Estado para colorear el mapa respetando el filtro de labor:
 * - "todas": estado combinado (verde si alguna labor está pendiente)
 * - labor concreta: solo esa labor (cerrada = gris aunque otra esté abierta)
 */
export function buildEstadoPorCuadroParaMapa(
  tareas: Tarea[],
  filtroTarea: string,
): Map<string, CuadroEstadoMapa> {
  return buildEstadoPorCuadro(filterTareasForMap(tareas, filtroTarea))
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
