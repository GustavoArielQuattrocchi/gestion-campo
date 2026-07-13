import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  findTareaContinuable,
  findTareaContinuableManual,
  findTareaContinuableMecanica,
} from './findTareaContinuable.ts'
import { findDuplicados } from './consolidarTareasLogic.ts'
import type { TareaManual, TareaMecanica } from '../types.ts'

const mockTs = { toDate: () => new Date('2026-06-25') } as import('firebase/firestore').Timestamp

function manual(id: string, tarea: string, cuadrilla: string, fincaId = 'FOA'): TareaManual {
  return {
    id,
    fincaId,
    fincaNombre: fincaId,
    tarea,
    cuadros: ['C1'],
    cuadroIds: [`${fincaId}-1`],
    estado: 'en_progreso',
    operador: 'op',
    fechaInicio: mockTs,
    tipo: 'manual',
    cuadrilla,
    cantidadPersonas: 4,
  }
}

function mecanica(id: string, tarea: string, persona: string, fincaId = 'FOA'): TareaMecanica {
  return {
    id,
    fincaId,
    fincaNombre: fincaId,
    tarea,
    cuadros: ['C1'],
    cuadroIds: [`${fincaId}-1`],
    estado: 'en_progreso',
    operador: 'op',
    fechaInicio: mockTs,
    tipo: 'mecanica',
    persona,
    maquinaria: 'MT27',
  }
}

describe('findTareaContinuable', () => {
  it('encuentra manual por finca+labor sin importar cuadrilla', () => {
    const activas = [manual('a', 'Podando', 'Cuadrilla Propia')]
    const found = findTareaContinuableManual(activas, 'Podando', 'Cuadrilla Externa')
    assert.equal(found?.id, 'a')
  })

  it('encuentra mecánica por finca+labor sin importar persona', () => {
    const activas = [mecanica('b', 'Rastra', 'Juan')]
    const found = findTareaContinuableMecanica(activas, 'Rastra', 'Pedro')
    assert.equal(found?.id, 'b')
  })

  it('no mezcla labores distintas', () => {
    const activas = [manual('a', 'Podando', 'Propia')]
    assert.equal(findTareaContinuable(activas, 'Desbrote', 'manual'), undefined)
  })
})

describe('findDuplicados', () => {
  it('agrupa por finca+labor+tipo aunque cambie ejecutor', () => {
    const tareas = [
      manual('1', 'Podando', 'Propia'),
      manual('2', 'Podando', 'Externa'),
      manual('3', 'Desbrote', 'Propia'),
    ]
    const grupos = findDuplicados(tareas)
    assert.equal(grupos.length, 1)
    assert.equal(grupos[0].principal.id, '1')
    assert.equal(grupos[0].duplicadas.length, 1)
    assert.equal(grupos[0].duplicadas[0].id, '2')
  })
})
