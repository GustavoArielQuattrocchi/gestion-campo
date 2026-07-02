import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildParteDeLaboresPayload } from './buildParteDeLaboresPayload.ts'
import type { TareaMecanica, TareaManual } from '../types.ts'

const mockTs = { toDate: () => new Date('2026-06-25T12:00:00Z') } as import('firebase/firestore').Timestamp

const manual: TareaManual = {
  id: 't1',
  fincaId: 'FOA',
  fincaNombre: 'FOA',
  tarea: 'Poda',
  cuadros: ['Cuartel 5'],
  cuadroIds: ['FOA-5'],
  estado: 'en_progreso',
  operador: 'Juan',
  fechaInicio: mockTs,
  tipo: 'manual',
  cuadrilla: 'Cuadrilla Propia',
  cantidadPersonas: 6,
}

const mecanica: TareaMecanica = {
  id: 't2',
  fincaId: 'FLP',
  fincaNombre: 'FLP',
  tarea: 'Rastra',
  cuadros: ['Cuartel 3'],
  cuadroIds: ['FLP-3'],
  estado: 'en_progreso',
  operador: 'Pedro',
  fechaInicio: mockTs,
  tipo: 'mecanica',
  persona: 'Pedro',
  maquinaria: 'MT27',
  maquinariaModelo: 'NEW HOLLAND TT-65-D',
  maquinariaId: 'FOA-2',
}

describe('buildParteDeLaboresPayload', () => {
  it('arma parte manual con operador del cierre', () => {
    const payload = buildParteDeLaboresPayload(manual, ' 3 ha podadas ', 'María', mockTs)
    assert.equal(payload.operador, 'María')
    assert.equal(payload.rendimiento, '3 ha podadas')
    assert.equal(payload.cuadrilla, 'Cuadrilla Propia')
    assert.equal(payload.cantidadPersonas, 6)
    assert.equal(payload.tareaId, 't1')
  })

  it('arma parte mecánica con maquinaria', () => {
    const payload = buildParteDeLaboresPayload(mecanica, '2 ha', 'Pedro', mockTs)
    assert.equal(payload.tipo, 'mecanica')
    assert.equal(payload.maquinariaModelo, 'NEW HOLLAND TT-65-D')
    assert.equal(payload.maquinariaId, 'FOA-2')
    assert.equal(payload.persona, 'Pedro')
  })

  it('incluye cantidad y unidad numéricas cuando se proveen', () => {
    const payload = buildParteDeLaboresPayload(manual, '12 jornal', 'María', mockTs, 12, 'jornal')
    assert.equal(payload.rendimiento, '12 jornal')
    assert.equal(payload.rendimientoCantidad, 12)
    assert.equal(payload.rendimientoUnidad, 'jornal')
  })

  it('omite cantidad y unidad si no se proveen (legacy)', () => {
    const payload = buildParteDeLaboresPayload(manual, '3 ha', 'María', mockTs)
    assert.equal('rendimientoCantidad' in payload, false)
    assert.equal('rendimientoUnidad' in payload, false)
  })

  it('marca finalizoTarea cuando el cierre finaliza la tarea', () => {
    const payload = buildParteDeLaboresPayload(manual, '12 jornal', 'María', mockTs, 12, 'jornal', true)
    assert.equal(payload.finalizoTarea, true)
  })

  it('omite finalizoTarea en un cierre de día normal', () => {
    const payload = buildParteDeLaboresPayload(manual, '12 jornal', 'María', mockTs, 12, 'jornal', false)
    assert.equal('finalizoTarea' in payload, false)
  })
})
