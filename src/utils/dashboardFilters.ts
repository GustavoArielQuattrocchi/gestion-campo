import type { Tarea, ParteDeLabores } from '../types'
import { isParteValidoDotacion } from './dotacion'

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

/** Partes para dotación (manual + mecánica; ignora filtro de estado de tareas). */
export function filterPartesForStaffing(
  partes: ParteDeLabores[],
  filtroFinca: string,
  filtroTipo: string,
): ParteDeLabores[] {
  return partes.filter(p => {
    if (!isParteValidoDotacion(p)) return false
    if (filtroTipo === 'manual' && p.tipo !== 'manual') return false
    if (filtroTipo === 'mecanica' && p.tipo !== 'mecanica') return false
    if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
    return true
  })
}

/** Partes de labores respetan finca y tipo globales (independiente del filtro de estado de tareas). */
export function applyPartesDashboardFilters(
  partes: ParteDeLabores[],
  filtroFinca: string,
  filtroTipo: string,
  _filtroEstado: string,
): ParteDeLabores[] {
  return partes.filter(p => {
    if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
    if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false
    return true
  })
}
