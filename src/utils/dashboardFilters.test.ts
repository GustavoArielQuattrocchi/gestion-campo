import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea, ParteDeLabores } from '../types'
import { applyDashboardFilters, applyPartesDashboardFilters, sortByFechaInicio } from './dashboardFilters'

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

function parte(overrides: Partial<ParteDeLabores> & { id: string }): ParteDeLabores {
  return {
    tareaId: 't1',
    fincaId: 'FOA',
    fincaNombre: 'Finca A',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    rendimiento: '10 ha',
    cuadros: [],
    cerradoEn: mockTs('2024-06-01T18:00:00') as ParteDeLabores['cerradoEn'],
    ...overrides,
  }
}

describe('applyPartesDashboardFilters', () => {
  const partes = [
    parte({ id: '1', fincaNombre: 'Finca A', tipo: 'manual' }),
    parte({ id: '2', fincaNombre: 'Finca B', tipo: 'mecanica' }),
  ]

  it('oculta partes si el estado global es solo en progreso', () => {
    assert.equal(applyPartesDashboardFilters(partes, 'todas', 'todos', 'en_progreso').length, 0)
  })

  it('filtra por finca y tipo con estado global todos', () => {
    const result = applyPartesDashboardFilters(partes, 'Finca B', 'mecanica', 'todos')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, '2')
  })
})
