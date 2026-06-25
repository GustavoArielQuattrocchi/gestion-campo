import { isSameDay } from 'date-fns'
import type { Tarea } from '../types'

/** True si la tarea ya tiene un cierre de parte de labores registrado hoy. */
export function tieneParteLaboresHoy(tarea: Tarea, referenceDate = new Date()): boolean {
  if (!tarea.rendimientosDiarios?.length) return false

  return tarea.rendimientosDiarios.some(r => {
    if (!r.fecha?.toDate) return false
    return isSameDay(r.fecha.toDate(), referenceDate)
  })
}

export function filterTareasPendientesParteLabores(
  tareas: Tarea[],
  referenceDate = new Date(),
): Tarea[] {
  return tareas.filter(t => !tieneParteLaboresHoy(t, referenceDate))
}
