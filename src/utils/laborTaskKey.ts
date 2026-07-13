import type { Tarea, TareaTipo } from '../types'

/** Clave de agrupación: una tarea en progreso por finca + labor + tipo (sin ejecutor). */
export function laborTaskGroupKey(t: Tarea): string {
  return `${t.fincaId}|${t.tarea}|${t.tipo}`.toLowerCase()
}

export function laborTaskGroupKeyParts(
  fincaId: string,
  tareaNombre: string,
  tipo: TareaTipo,
): string {
  return `${fincaId}|${tareaNombre.trim()}|${tipo}`.toLowerCase()
}

export function tareaMatchesLaborGroup(t: Tarea, tareaNombre: string, tipo: TareaTipo): boolean {
  return (
    t.estado === 'en_progreso' &&
    t.tipo === tipo &&
    t.tarea.trim().toLowerCase() === tareaNombre.trim().toLowerCase()
  )
}
