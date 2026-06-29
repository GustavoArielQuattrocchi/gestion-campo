import type { Tarea, ParteDeLabores } from '../types'

export function sortByFechaInicio(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    const timeA = a.fechaInicio?.toDate?.()?.getTime() ?? 0
    const timeB = b.fechaInicio?.toDate?.()?.getTime() ?? 0
    return timeB - timeA
  })
}

export function applyDashboardFilters(
  tareas: Tarea[],
  filtroFinca: string,
  filtroTipo: string,
  filtroEstado: string,
): Tarea[] {
  return tareas.filter(t => {
    if (filtroFinca !== 'todas' && t.fincaNombre !== filtroFinca) return false
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false
    return true
  })
}

/** Partes de labores respetan finca y tipo globales; solo visibles si el estado global no es solo "en progreso". */
export function applyPartesDashboardFilters(
  partes: ParteDeLabores[],
  filtroFinca: string,
  filtroTipo: string,
  filtroEstado: string,
): ParteDeLabores[] {
  if (filtroEstado === 'en_progreso') return []
  return partes.filter(p => {
    if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
    if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
    return true
  })
}
