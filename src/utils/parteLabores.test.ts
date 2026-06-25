import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { TareaManual } from '../types.ts'
import { filterTareasPendientesParteLabores, tieneParteLaboresHoy } from './parteLabores.ts'

const mockTs = (iso: string) =>
  ({ toDate: () => new Date(iso) }) as import('firebase/firestore').Timestamp

const baseTarea: TareaManual = {
  id: 't1',
  fincaId: 'FOA',
  fincaNombre: 'FOA',
  tarea: 'Poda',
  cuadros: ['Cuartel 5'],
  estado: 'en_progreso',
  operador: 'Juan',
  fechaInicio: mockTs('2026-06-20T10:00:00Z'),
  tipo: 'manual',
  cuadrilla: 'Cuadrilla Propia',
  cantidadPersonas: 4,
}

describe('tieneParteLaboresHoy', () => {
  it('devuelve false sin rendimientos diarios', () => {
    assert.equal(tieneParteLaboresHoy(baseTarea, new Date('2026-06-25T15:00:00Z')), false)
  })

  it('detecta parte cerrado hoy', () => {
    const tarea = {
      ...baseTarea,
      rendimientosDiarios: [
        { fecha: mockTs('2026-06-24T12:00:00Z'), texto: 'ayer', operador: 'Juan' },
        { fecha: mockTs('2026-06-25T14:00:00Z'), texto: 'hoy', operador: 'Juan' },
      ],
    }
    assert.equal(tieneParteLaboresHoy(tarea, new Date('2026-06-25T20:00:00Z')), true)
  })

  it('permite cierre si el último parte fue otro día', () => {
    const tarea = {
      ...baseTarea,
      rendimientosDiarios: [
        { fecha: mockTs('2026-06-24T12:00:00Z'), texto: 'ayer', operador: 'Juan' },
      ],
    }
    assert.equal(tieneParteLaboresHoy(tarea, new Date('2026-06-25T10:00:00Z')), false)
  })
})

describe('filterTareasPendientesParteLabores', () => {
  it('excluye tareas con parte cerrado hoy', () => {
    const hoy = new Date('2026-06-25T12:00:00Z')
    const tareas = [
      baseTarea,
      {
        ...baseTarea,
        id: 't2',
        rendimientosDiarios: [
          { fecha: mockTs('2026-06-25T09:00:00Z'), texto: 'ok', operador: 'Juan' },
        ],
      },
    ]
    const pendientes = filterTareasPendientesParteLabores(tareas, hoy)
    assert.equal(pendientes.length, 1)
    assert.equal(pendientes[0].id, 't1')
  })
})
