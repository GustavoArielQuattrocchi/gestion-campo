import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea } from '../types'
import {
  filterTareasForMap,
  listMapTareasDisponibles,
  normalizeMapTareaParam,
} from './mapTaskFilter'

function tarea(overrides: Partial<Tarea> & { id: string; tarea: string }): Tarea {
  return {
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    cuadros: [],
    estado: 'en_progreso',
    operador: 'Juan',
    fechaInicio: { toDate: () => new Date() } as Tarea['fechaInicio'],
    tipo: 'manual',
    cuadrilla: 'C1',
    cantidadPersonas: 5,
    ...overrides,
  }
}

describe('listMapTareasDisponibles', () => {
  it('devuelve labores únicas ordenadas', () => {
    const tareas = [
      tarea({ id: '1', tarea: 'Poda' }),
      tarea({ id: '2', tarea: 'Desmalezado' }),
      tarea({ id: '3', tarea: 'Poda' }),
    ]
    assert.deepEqual(listMapTareasDisponibles(tareas), ['Desmalezado', 'Poda'])
  })
})

describe('filterTareasForMap', () => {
  it('devuelve todas si el filtro es todas', () => {
    const tareas = [tarea({ id: '1', tarea: 'Poda' }), tarea({ id: '2', tarea: 'Rastra' })]
    assert.equal(filterTareasForMap(tareas, 'todas').length, 2)
  })

  it('filtra por nombre de labor', () => {
    const tareas = [tarea({ id: '1', tarea: 'Poda' }), tarea({ id: '2', tarea: 'Rastra' })]
    const result = filterTareasForMap(tareas, 'Poda')
    assert.equal(result.length, 1)
    assert.equal(result[0].tarea, 'Poda')
  })
})

describe('normalizeMapTareaParam', () => {
  it('resetea labor inválida a todas', () => {
    assert.equal(normalizeMapTareaParam('Poda', ['Rastra']), 'todas')
    assert.equal(normalizeMapTareaParam(null, ['Poda']), 'todas')
  })

  it('conserva labor válida', () => {
    assert.equal(normalizeMapTareaParam('Poda', ['Poda', 'Rastra']), 'Poda')
  })
})
