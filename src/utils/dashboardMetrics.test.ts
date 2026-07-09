import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ParteDeLabores, Tarea } from '../types'
import {
  aggregateManualStaffingFromPartes,
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

function parteManual(overrides: Partial<ParteDeLabores> & { id: string }): ParteDeLabores {
  const cerradoEn = mockTs('2024-07-01T18:00:00')
  return {
    tareaId: '1',
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    estado: 'cerrado',
    abiertoEn: cerradoEn,
    rendimiento: '10 hileras',
    cuadros: [],
    cuadrilla: 'C1',
    cantidadPersonas: 8,
    cerradoEn,
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
    assert.equal(result.personasDias, 20)
    assert.equal(result.dias, 2)
    assert.equal(result.promedio, '10.0')
  })

  it('usa fechas de rendimientos diarios en tareas multi-día', () => {
    const manuales = [
      manual({
        id: '1',
        cantidadPersonas: 8,
        fechaInicio: mockTs('2024-06-26T10:00:00'),
        rendimientosDiarios: [
          { fecha: mockTs('2024-06-26T18:00:00'), texto: '50 hileras', operador: 'Juan' },
          { fecha: mockTs('2024-07-01T18:00:00'), texto: '40 hileras', operador: 'Juan' },
          { fecha: mockTs('2024-07-08T18:00:00'), texto: '35 hileras', operador: 'Juan' },
        ],
      }),
    ]
    const result = computePersonasPorDia(manuales)
    assert.equal(result.personasDias, 24)
    assert.equal(result.dias, 3)
    assert.equal(result.promedio, '8.0')
  })

  it('prioriza partes de labores cerrados desde campo', () => {
    const manuales = [
      manual({
        id: '1',
        cantidadPersonas: 8,
        fechaInicio: mockTs('2024-06-26T10:00:00'),
      }),
    ]
    const partes = [
      parteManual({ id: 'p1', cantidadPersonas: 10, cerradoEn: mockTs('2024-07-01T18:00:00') }),
      parteManual({ id: 'p2', cantidadPersonas: 10, cerradoEn: mockTs('2024-07-08T18:00:00') }),
    ]
    const result = computePersonasPorDia(manuales, partes)
    assert.equal(result.personasDias, 20)
    assert.equal(result.dias, 2)
    assert.equal(result.promedio, '10.0')
  })
})

describe('aggregateManualStaffingFromPartes', () => {
  it('suma personas por día de cierre', () => {
    const partes = [
      parteManual({ id: 'p1', cantidadPersonas: 6, cerradoEn: mockTs('2024-07-09T12:00:00') }),
      parteManual({ id: 'p2', cantidadPersonas: 4, cerradoEn: mockTs('2024-07-09T18:00:00') }),
    ]
    const daily = aggregateManualStaffingFromPartes(partes)
    assert.equal(daily.length, 1)
    assert.equal(daily[0].personas, 10)
    assert.equal(daily[0].tareas, 2)
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
    assert.equal(stats.personasDias, 12)
    assert.equal(stats.personasPorDia, '12.0')
    assert.equal(getManuales(tareas).length, 2)
  })

  it('usa partes de labores para personas-día', () => {
    const tareas: Tarea[] = [manual({ id: '1', cantidadPersonas: 5 })]
    const partes = [
      parteManual({ id: 'p1', cantidadPersonas: 12, cerradoEn: mockTs('2024-07-09T10:00:00') }),
      parteManual({ id: 'p2', cantidadPersonas: 12, cerradoEn: mockTs('2024-07-10T10:00:00') }),
    ]
    const stats = computeDashboardStats(tareas, partes)
    assert.equal(stats.personasDias, 24)
    assert.equal(stats.personasPorDia, '12.0')
  })
})
