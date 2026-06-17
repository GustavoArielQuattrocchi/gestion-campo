import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildManualTaskFirestorePayload,
  buildMechanicalTaskFirestorePayload,
  hasMobileSession,
} from './mobileTaskPayloads'

const mockTs = { toDate: () => new Date() } as import('firebase/firestore').Timestamp

describe('hasMobileSession', () => {
  it('requiere operador y finca', () => {
    assert.equal(hasMobileSession('Juan', 'FOA', 'Finca Ocho A'), true)
    assert.equal(hasMobileSession('', 'FOA', 'Finca Ocho A'), false)
    assert.equal(hasMobileSession('Juan', '', 'Finca Ocho A'), false)
  })
})

describe('buildManualTaskFirestorePayload', () => {
  it('arma payload manual en progreso', () => {
    const payload = buildManualTaskFirestorePayload(
      {
        cuadrilla: 'C1',
        tarea: 'Poda',
        cantidadPersonas: 5,
        cuadros: ['Cuartel 5'],
        cuadroIds: ['FOA-5'],
      },
      { fincaId: 'FOA', fincaNombre: 'Finca Ocho A', operadorNombre: 'Juan', fechaInicio: mockTs },
    )
    assert.equal(payload.tipo, 'manual')
    assert.equal(payload.estado, 'en_progreso')
    assert.equal(payload.operador, 'Juan')
    assert.deepEqual(payload.cuadroIds, ['FOA-5'])
  })
})

describe('buildMechanicalTaskFirestorePayload', () => {
  it('arma payload mecánico en progreso', () => {
    const payload = buildMechanicalTaskFirestorePayload(
      {
        tarea: 'Desmalezado',
        persona: 'Pedro',
        maquinaria: 'Tractor',
        cuadros: ['Cuartel 5'],
        cuadroIds: ['FOA-5'],
      },
      { fincaId: 'FOA', fincaNombre: 'Finca Ocho A', operadorNombre: 'Juan', fechaInicio: mockTs },
    )
    assert.equal(payload.tipo, 'mecanica')
    assert.equal(payload.maquinaria, 'Tractor')
    assert.equal(payload.persona, 'Pedro')
  })
})
