import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea } from '../types'
import { getMetricDetail } from './getMetricDetail'

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as Tarea['fechaInicio']
}

const tareas: Tarea[] = [
  {
    id: '1',
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Poda',
    cuadros: ['Cuartel 5'],
    cuadroIds: ['FOA-5'],
    estado: 'finalizada',
    operador: 'Juan',
    fechaInicio: mockTs('2024-06-01T10:00:00'),
    fechaFin: mockTs('2024-06-01T18:00:00'),
    rendimiento: '95%',
    tipo: 'manual',
    cuadrilla: 'Cuadrilla 1',
    cantidadPersonas: 8,
  },
  {
    id: '2',
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Rastra',
    cuadros: [],
    estado: 'en_progreso',
    operador: 'Ana',
    fechaInicio: mockTs('2024-06-02T09:00:00'),
    tipo: 'mecanica',
    persona: 'Ana',
    maquinaria: 'Tractor',
  },
]

describe('getMetricDetail', () => {
  it('devuelve todas las tareas para total', () => {
    const detail = getMetricDetail('total', tareas)
    assert.equal(detail.title, 'Total de tareas')
    assert.equal(detail.rows.length, 2)
    assert.equal(detail.rows[0].tarea, 'Poda')
  })

  it('filtra finalizadas', () => {
    const detail = getMetricDetail('finalizadas', tareas)
    assert.equal(detail.rows.length, 1)
    assert.equal(detail.rows[0].rendimiento, '95%')
  })

  it('filtra en progreso', () => {
    const detail = getMetricDetail('en_progreso', tareas)
    assert.equal(detail.rows.length, 1)
    assert.equal(detail.rows[0].tipo, 'Mecánica')
  })

  it('lista rendimiento registrado', () => {
    const detail = getMetricDetail('rendimiento', tareas)
    assert.equal(detail.rows.length, 1)
    assert.match(detail.summary ?? '', /1 tarea/)
  })
})
