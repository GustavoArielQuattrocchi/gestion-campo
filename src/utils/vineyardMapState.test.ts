import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Tarea } from '../types'
import { buildEstadoPorCuadro } from './vineyardMapState'

function tareaManual(id: string, cuadroId: string, finalizados: string[] = []): Tarea {
  return {
    id,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tipo: 'manual',
    tarea: 'Podando',
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 4,
    cuadros: ['Cuartel 5'],
    cuadroIds: [cuadroId],
    cuadroIdsFinalizados: finalizados,
    estado: 'en_progreso',
    operador: 'Juan',
    fechaInicio: { seconds: 0, nanoseconds: 0 } as Tarea['fechaInicio'],
  }
}

describe('buildEstadoPorCuadro', () => {
  it('marca cuadro como pendiente si la tarea está en progreso', () => {
    const map = buildEstadoPorCuadro([tareaManual('1', 'FOA-5')])
    const estado = map.get('FOA-5')
    assert.equal(estado?.pendiente, true)
    assert.equal(estado?.cuadroFinalizado, false)
    assert.equal(estado?.tareasEnProgreso.length, 1)
  })

  it('marca cuadro finalizado si está en cuadroIdsFinalizados', () => {
    const map = buildEstadoPorCuadro([tareaManual('1', 'FOA-5', ['FOA-5'])])
    const estado = map.get('FOA-5')
    assert.equal(estado?.pendiente, false)
    assert.equal(estado?.cuadroFinalizado, true)
  })
})
