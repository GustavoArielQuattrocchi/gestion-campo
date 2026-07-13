import { cuadroFinalizadoEnTarea, filterTareasPorCuadro } from '../../utils/cuadroTareas'
import type { Tarea } from '../../types'

export function getTareasEnProgresoEnCuadro(
  tareas: Tarea[],
  fincaId: string,
  cuadroId: string,
): Tarea[] {
  return filterTareasPorCuadro(tareas, fincaId, cuadroId).filter(t => t.estado === 'en_progreso')
}

/** Tareas activas donde el cuadro aún no fue marcado como finalizado. */
export function getTareasPendientesEnCuadro(
  tareas: Tarea[],
  fincaId: string,
  cuadroId: string,
): Tarea[] {
  return getTareasEnProgresoEnCuadro(tareas, fincaId, cuadroId).filter(
    t => !cuadroFinalizadoEnTarea(t, cuadroId),
  )
}

export interface AsignarLaborConflict {
  tareasPendientes: Tarea[]
}

export function detectAsignarLaborConflict(
  tareas: Tarea[],
  fincaId: string,
  cuadroId: string,
): AsignarLaborConflict | null {
  const tareasPendientes = getTareasPendientesEnCuadro(tareas, fincaId, cuadroId)
  if (tareasPendientes.length === 0) return null
  return { tareasPendientes }
}
