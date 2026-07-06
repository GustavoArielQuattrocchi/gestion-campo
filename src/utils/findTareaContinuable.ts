import type { Tarea } from '../types'

/**
 * Busca una tarea en_progreso que coincida con la misma labor y ejecutor
 * para ofrecer continuar en vez de crear una nueva.
 *
 * Manual:  finca + tarea + cuadrilla
 * Mecánica: finca + tarea + persona
 */
export function findTareaContinuableManual(
  tareasActivas: Tarea[],
  tareaNombre: string,
  cuadrilla: string,
): Tarea | undefined {
  if (!tareaNombre || !cuadrilla) return undefined
  const tn = tareaNombre.trim().toLowerCase()
  const cn = cuadrilla.trim().toLowerCase()
  return tareasActivas.find(
    t =>
      t.estado === 'en_progreso' &&
      t.tipo === 'manual' &&
      t.tarea.trim().toLowerCase() === tn &&
      t.cuadrilla.trim().toLowerCase() === cn,
  )
}

export function findTareaContinuableMecanica(
  tareasActivas: Tarea[],
  tareaNombre: string,
  persona: string,
): Tarea | undefined {
  if (!tareaNombre || !persona) return undefined
  const tn = tareaNombre.trim().toLowerCase()
  const pn = persona.trim().toLowerCase()
  return tareasActivas.find(
    t =>
      t.estado === 'en_progreso' &&
      t.tipo === 'mecanica' &&
      t.tarea.trim().toLowerCase() === tn &&
      t.persona.trim().toLowerCase() === pn,
  )
}
