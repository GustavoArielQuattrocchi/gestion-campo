import type { Tarea } from '../types'

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
