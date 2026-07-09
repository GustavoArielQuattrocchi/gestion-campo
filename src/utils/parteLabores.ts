import type { ParteDeLabores, Tarea } from '../types'
import { filterTareasConParteAbierto, tieneParteAbierto } from './parteEstado'

export { filterTareasConParteAbierto, tieneParteAbierto }

/** Tareas con parte abierto pendiente de cierre de jornada. */
export function filterTareasPendientesParteLabores(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
): Tarea[] {
  return filterTareasConParteAbierto(tareas, partesAbiertos)
}
