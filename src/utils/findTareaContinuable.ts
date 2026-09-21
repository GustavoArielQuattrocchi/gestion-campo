import type { Tarea, TareaAlcance, TareaTipo } from '../types'
import { tareaMatchesLaborGroup } from './laborTaskKey'
import { esTareaTodaLaFinca } from './tareaAlcance'

/**
 * Busca una tarea en_progreso que coincida con la misma labor en la finca
 * (sin importar cuadrilla u operario) para continuar en vez de crear una nueva.
 * No mezcla alcance finca con tareas de cuadros.
 */
export function findTareaContinuable(
  tareasActivas: Tarea[],
  tareaNombre: string,
  tipo: TareaTipo,
  alcance: TareaAlcance = 'cuadros',
): Tarea | undefined {
  if (!tareaNombre.trim()) return undefined
  const quiereFinca = alcance === 'finca'
  return tareasActivas.find(
    t => tareaMatchesLaborGroup(t, tareaNombre, tipo) && esTareaTodaLaFinca(t) === quiereFinca,
  )
}

/** @deprecated El parámetro cuadrilla ya no filtra; se mantiene por compatibilidad de firma. */
export function findTareaContinuableManual(
  tareasActivas: Tarea[],
  tareaNombre: string,
  _cuadrilla?: string,
  alcance: TareaAlcance = 'cuadros',
): Tarea | undefined {
  return findTareaContinuable(tareasActivas, tareaNombre, 'manual', alcance)
}

/** @deprecated El parámetro persona ya no filtra; se mantiene por compatibilidad de firma. */
export function findTareaContinuableMecanica(
  tareasActivas: Tarea[],
  tareaNombre: string,
  _persona?: string,
  alcance: TareaAlcance = 'cuadros',
): Tarea | undefined {
  return findTareaContinuable(tareasActivas, tareaNombre, 'mecanica', alcance)
}
