import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea } from '../types'
import { applyDashboardFilters, sortByFechaInicio } from './dashboardFilters'

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as Tarea['fechaInicio']
}

function tarea(overrides: Partial<Tarea> & { id: string }): Tarea {
  return {
    fincaId: 'FOA',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Poda',
    cuadros: [],
    estado: 'en_progreso',
    operador: 'Juan',
    fechaInicio: mockTs('2024-06-01T10:00:00'),
    tipo: 'manual',
    cuadrilla: 'C1',
    cantidadPersonas: 5,
    ...overrides,
  } as Tarea
}

describe('applyDashboardFilters', () => {
  const tareas = [
    tarea({ id: '1', fincaNombre: 'Finca A', tipo: 'manual', estado: 'en_progreso' }),
    tarea({
      id: '2',
      fincaNombre: 'Finca B',
      tipo: 'mecanica',
      estado: 'finalizada',
      persona: 'Ana',
      maquinaria: 'Tractor',
    } as Partial<Tarea> & { id: string }),
  ]

  it('sin filtros devuelve todo', () => {
    assert.equal(applyDashboardFilters(tareas, 'todas', 'todos', 'todos').length, 2)
  })

  it('filtra por finca', () => {
    assert.equal(applyDashboardFilters(tareas, 'Finca A', 'todos', 'todos').length, 1)
  })

  it('filtra por tipo y estado', () => {
    const result = applyDashboardFilters(tareas, 'todas', 'mecanica', 'finalizada')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, '2')
  })
})

describe('sortByFechaInicio', () => {
  it('ordena descendente por fecha', () => {
    const sorted = sortByFechaInicio([
      tarea({ id: '1', fechaInicio: mockTs('2024-06-01T10:00:00') }),
      tarea({ id: '2', fechaInicio: mockTs('2024-06-03T10:00:00') }),
    ])
    assert.equal(sorted[0].id, '2')
    assert.equal(sorted[1].id, '1')
  })
})
