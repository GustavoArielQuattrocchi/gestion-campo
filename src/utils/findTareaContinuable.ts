import type { Tarea, TareaTipo } from '../types'
import { tareaMatchesLaborGroup } from './laborTaskKey'

/**
 * Busca una tarea en_progreso que coincida con la misma labor en la finca
 * (sin importar cuadrilla u operario) para continuar en vez de crear una nueva.
 */
export function findTareaContinuable(
  tareasActivas: Tarea[],
  tareaNombre: string,
  tipo: TareaTipo,
): Tarea | undefined {
  if (!tareaNombre.trim()) return undefined
  return tareasActivas.find(t => tareaMatchesLaborGroup(t, tareaNombre, tipo))
}

/** @deprecated El parámetro cuadrilla ya no filtra; se mantiene por compatibilidad de firma. */
export function findTareaContinuableManual(
  tareasActivas: Tarea[],
  tareaNombre: string,
  _cuadrilla?: string,
): Tarea | undefined {
  return findTareaContinuable(tareasActivas, tareaNombre, 'manual')
}

/** @deprecated El parámetro persona ya no filtra; se mantiene por compatibilidad de firma. */
export function findTareaContinuableMecanica(
  tareasActivas: Tarea[],
  tareaNombre: string,
  _persona?: string,
): Tarea | undefined {
  return findTareaContinuable(tareasActivas, tareaNombre, 'mecanica')
}
