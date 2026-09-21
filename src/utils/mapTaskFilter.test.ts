import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ParteDeLabores, Tarea } from '../types'
import {
  defaultMapFechaFilter,
  filterTareasByMapFecha,
  filterTareasForMap,
  listMapTareasDisponibles,
  normalizeMapTareaParam,
  rendimientoCoincideFechaMapa,
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

  it('omite labores de toda la finca', () => {
    const tareas = [
      tarea({ id: '1', tarea: 'Poda de raíces', alcance: 'finca' }),
      tarea({ id: '2', tarea: 'Poda' }),
    ]
    assert.deepEqual(listMapTareasDisponibles(tareas), ['Poda'])
    assert.equal(filterTareasForMap(tareas, 'todas').length, 1)
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

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as Tarea['fechaInicio']
}

function parte(overrides: Partial<ParteDeLabores> & { id: string; tareaId: string }): ParteDeLabores {
  return {
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    estado: 'cerrado',
    abiertoEn: mockTs('2026-09-21T08:00:00'),
    cuadros: ['Cuartel 5'],
    cuadroIds: ['FOA-5'],
    ...overrides,
  }
}

describe('defaultMapFechaFilter', () => {
  it('predetermina el día en curso', () => {
    const filtro = defaultMapFechaFilter(new Date('2026-09-21T15:00:00'))
    assert.equal(filtro.modo, 'dia')
    assert.equal(filtro.fecha, '2026-09-21')
  })
})

describe('filterTareasByMapFecha', () => {
  const tareas = [
    tarea({ id: 't1', tarea: 'Poda', cuadroIds: ['FOA-5', 'FOA-6'], cuadros: ['Cuartel 5', 'Cuartel 6'] }),
    tarea({ id: 't2', tarea: 'Rastra', cuadroIds: ['FOA-7'], cuadros: ['Cuartel 7'] }),
  ]

  it('solo incluye tareas con parte ese día y recorta cuadros del parte', () => {
    const { tareas: scoped } = filterTareasByMapFecha(
      tareas,
      [
        parte({ id: 'p1', tareaId: 't1', abiertoEn: mockTs('2026-09-21T08:00:00'), cuadroIds: ['FOA-5'], cuadros: ['Cuartel 5'] }),
        parte({ id: 'p2', tareaId: 't2', abiertoEn: mockTs('2026-09-20T08:00:00') }),
      ],
      { modo: 'dia', fecha: '2026-09-21' },
    )
    assert.equal(scoped.length, 1)
    assert.equal(scoped[0].id, 't1')
    assert.deepEqual(scoped[0].cuadroIds, ['FOA-5'])
    assert.deepEqual(scoped[0].cuadros, ['Cuartel 5'])
  })

  it('incluye el rango de fechas', () => {
    const { tareas: scoped } = filterTareasByMapFecha(
      tareas,
      [
        parte({ id: 'p1', tareaId: 't1', abiertoEn: mockTs('2026-09-20T08:00:00') }),
        parte({ id: 'p2', tareaId: 't2', abiertoEn: mockTs('2026-09-22T08:00:00') }),
      ],
      { modo: 'rango', desde: '2026-09-20', hasta: '2026-09-21' },
    )
    assert.deepEqual(scoped.map(t => t.id), ['t1'])
  })

  it('todas las fechas no recorta tareas', () => {
    const { tareas: scoped } = filterTareasByMapFecha(
      tareas,
      [],
      { modo: 'todas' },
    )
    assert.equal(scoped, tareas)
  })
})

describe('rendimientoCoincideFechaMapa', () => {
  it('usa el parteId de la jornada', () => {
    const rd = { fecha: mockTs('2026-09-22T18:00:00'), parteId: 'p1' }
    assert.equal(
      rendimientoCoincideFechaMapa(rd, { modo: 'dia', fecha: '2026-09-21' }, new Set(['p1'])),
      true,
    )
    assert.equal(
      rendimientoCoincideFechaMapa(rd, { modo: 'dia', fecha: '2026-09-21' }, new Set(['p9'])),
      false,
    )
  })
})
