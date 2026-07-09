import type { ParteDeLabores, Tarea } from '../types'
import {
  filterTareasConParteAbierto,
  filterTareasConParteAbiertoHoy,
  filterTareasConParteVencido,
  tieneParteAbierto,
} from './parteEstado'

export { filterTareasConParteAbierto, tieneParteAbierto }

/** Tareas con parte abierto pendiente de cierre (hoy o vencidos). */
export function filterTareasPendientesParteLabores(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
): Tarea[] {
  return filterTareasConParteAbierto(tareas, partesAbiertos)
}

/** Tareas con parte abierto hoy. */
export function filterTareasPendientesHoy(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
  referenceDate = new Date(),
): Tarea[] {
  return filterTareasConParteAbiertoHoy(tareas, partesAbiertos, referenceDate)
}

/** Tareas con parte abierto de días anteriores sin cerrar. */
export function filterTareasPendientesVencidas(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
  referenceDate = new Date(),
): Tarea[] {
  return filterTareasConParteVencido(tareas, partesAbiertos, referenceDate)
}
