import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Tarea } from '../../types'
import {
  detectAsignarLaborConflict,
  getTareasPendientesEnCuadro,
} from './escritorioTareaConflicts.ts'

function tareaBase(overrides: Partial<Tarea> & Pick<Tarea, 'id' | 'tipo'>): Tarea {
  const base = {
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tarea: 'Podando',
    cuadros: ['Cuartel 5'],
    cuadroIds: ['FOA-5'],
    estado: 'en_progreso' as const,
    operador: 'Juan',
    fechaInicio: { seconds: 0, nanoseconds: 0 } as Tarea['fechaInicio'],
  }
  if (overrides.tipo === 'manual') {
    return {
      ...base,
      tipo: 'manual',
      cuadrilla: 'Cuadrilla Propia',
      cantidadPersonas: 4,
      ...overrides,
    } as Tarea
  }
  return {
    ...base,
    tipo: 'mecanica',
    persona: 'Pedro',
    maquinaria: 'Tractor',
    ...overrides,
  } as Tarea
}

describe('escritorioTareaConflicts', () => {
  it('detecta tareas pendientes en el cuadro', () => {
    const tareas = [
      tareaBase({ id: '1', tipo: 'manual', cuadroIdsFinalizados: [] }),
      tareaBase({
        id: '2',
        tipo: 'manual',
        cuadroIds: ['FOA-7'],
        cuadros: ['Cuartel 7'],
        cuadroIdsFinalizados: ['FOA-7'],
      }),
    ]

    const pendientes = getTareasPendientesEnCuadro(tareas, 'FOA', 'FOA-5')
    assert.equal(pendientes.length, 1)
    assert.equal(pendientes[0].id, '1')
  })

  it('no reporta conflicto si el cuadro ya está finalizado en todas las tareas activas', () => {
    const tareas = [
      tareaBase({
        id: '1',
        tipo: 'manual',
        cuadroIdsFinalizados: ['FOA-5'],
      }),
    ]

    assert.equal(detectAsignarLaborConflict(tareas, 'FOA', 'FOA-5'), null)
  })

  it('reporta conflicto cuando hay tarea en progreso sin finalizar', () => {
    const tareas = [tareaBase({ id: '1', tipo: 'manual' })]
    const conflict = detectAsignarLaborConflict(tareas, 'FOA', 'FOA-5')
    assert.equal(conflict?.tareasPendientes.length, 1)
  })
})
