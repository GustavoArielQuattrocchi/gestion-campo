import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { TareaManual } from '../types.ts'
import { filterTareasPendientesParteLabores } from './parteLabores.ts'
import type { ParteDeLabores } from '../types.ts'

const mockTs = (iso: string) =>
  ({ toDate: () => new Date(iso), seconds: Math.floor(new Date(iso).getTime() / 1000) }) as import('firebase/firestore').Timestamp

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

function parteAbierto(tareaId: string): ParteDeLabores {
  return {
    id: 'p1',
    tareaId,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    estado: 'abierto',
    abiertoEn: mockTs('2026-06-25T08:00:00Z'),
    cuadros: [],
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 4,
  }
}

describe('filterTareasPendientesParteLabores', () => {
  it('incluye solo tareas con parte abierto', () => {
    const tareas = [baseTarea, { ...baseTarea, id: 't2' }]
    const partes = [parteAbierto('t1')]
    const pendientes = filterTareasPendientesParteLabores(tareas, partes)
    assert.equal(pendientes.length, 1)
    assert.equal(pendientes[0].id, 't1')
  })

  it('excluye tareas sin parte abierto', () => {
    const pendientes = filterTareasPendientesParteLabores([baseTarea], [])
    assert.equal(pendientes.length, 0)
  })
})
