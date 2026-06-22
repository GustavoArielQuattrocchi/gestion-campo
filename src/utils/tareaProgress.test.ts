import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeTareaProgress, resolveTaskCuadroIds } from './tareaProgress'
import type { TareaManual } from '../types'

const base: TareaManual = {
  id: '1',
  fincaId: 'FOA',
  fincaNombre: 'FOA',
  tarea: 'Poda',
  cuadros: ['Cuartel 5'],
  cuadroIds: ['FOA-5'],
  estado: 'en_progreso',
  operador: 'Juan',
  fechaInicio: { toDate: () => new Date() } as import('firebase/firestore').Timestamp,
  tipo: 'manual',
  cuadrilla: 'Cuadrilla Propia',
  cantidadPersonas: 4,
}

describe('resolveTaskCuadroIds', () => {
  it('usa cuadroIds cuando están presentes', () => {
    assert.deepEqual(resolveTaskCuadroIds(base), ['FOA-5'])
  })
})

describe('computeTareaProgress', () => {
  it('devuelve 0% sin cuadros finalizados', () => {
    const p = computeTareaProgress(base)
    assert.equal(p.porcentaje, 0)
    assert.ok(p.hectareasFinca > 0)
    assert.deepEqual(p.cuadrosPendientes, ['FOA-5'])
  })

  it('calcula % sobre hectáreas totales de la finca', () => {
    const p = computeTareaProgress({ ...base, cuadroIdsFinalizados: ['FOA-5'] })
    const esperado = Math.round((10.22 / p.hectareasFinca) * 1000) / 10
    assert.equal(p.porcentaje, esperado)
    assert.equal(p.hectareasFinalizadas, 10.22)
  })
})
