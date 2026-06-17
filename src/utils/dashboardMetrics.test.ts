import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea } from '../types'
import {
  computeDashboardStats,
  computePersonasPorDia,
  countDiasConActividad,
  getManuales,
} from './dashboardMetrics'

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as Tarea['fechaInicio']
}

function manual(
  overrides: Partial<Extract<Tarea, { tipo: 'manual' }>> & { id: string },
): Extract<Tarea, { tipo: 'manual' }> {
  return {
    fincaId: 'foa',
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
  }
}

describe('computePersonasPorDia', () => {
  it('promedia solo tareas manuales por día con actividad', () => {
    const manuales = [
      manual({ id: '1', cantidadPersonas: 10, fechaInicio: mockTs('2024-06-01T10:00:00') }),
      manual({ id: '2', cantidadPersonas: 6, fechaInicio: mockTs('2024-06-01T14:00:00') }),
      manual({ id: '3', cantidadPersonas: 4, fechaInicio: mockTs('2024-06-02T10:00:00') }),
    ]
    const result = computePersonasPorDia(manuales)
    assert.equal(result.totalPersonas, 20)
    assert.equal(result.dias, 2)
    assert.equal(result.promedio, '10.0')
  })
})

describe('countDiasConActividad', () => {
  it('cuenta días únicos', () => {
    const tareas = [
      manual({ id: '1', fechaInicio: mockTs('2024-06-01T08:00:00') }),
      manual({ id: '2', fechaInicio: mockTs('2024-06-01T18:00:00') }),
      manual({ id: '3', fechaInicio: mockTs('2024-06-03T10:00:00') }),
    ]
    assert.equal(countDiasConActividad(tareas), 2)
  })
})

describe('computeDashboardStats', () => {
  it('agrega métricas de tareas mixtas', () => {
    const tareas: Tarea[] = [
      manual({ id: '1', estado: 'finalizada', cantidadPersonas: 8, rendimiento: '100%' }),
      manual({ id: '2', estado: 'en_progreso', cantidadPersonas: 4 }),
      {
        id: '3',
        fincaId: 'foa',
        fincaNombre: 'Finca Ocho A',
        tarea: 'Rastra',
        cuadros: [],
        estado: 'finalizada',
        operador: 'Ana',
        fechaInicio: mockTs('2024-06-01T10:00:00'),
        tipo: 'mecanica',
        persona: 'Ana',
        maquinaria: 'Tractor',
      },
    ]

    const stats = computeDashboardStats(tareas)
    assert.equal(stats.total, 3)
    assert.equal(stats.finalizadas, 2)
    assert.equal(stats.enProgreso, 1)
    assert.equal(stats.rendimientoPorTarea, 1)
    assert.equal(stats.totalPersonas, 12)
    assert.equal(stats.personasPorDia, '12.0')
    assert.equal(getManuales(tareas).length, 2)
  })
})
