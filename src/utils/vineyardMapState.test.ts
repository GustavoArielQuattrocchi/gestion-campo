import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Tarea } from '../types'
import { buildEstadoPorCuadro, buildEstadoPorCuadroParaMapa } from './vineyardMapState'

function tareaManual(
  id: string,
  cuadroId: string,
  opts: {
    tarea?: string
    estado?: Tarea['estado']
    finalizados?: string[]
  } = {},
): Tarea {
  return {
    id,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tipo: 'manual',
    tarea: opts.tarea ?? 'Podando',
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 4,
    cuadros: ['Cuartel 5'],
    cuadroIds: [cuadroId],
    cuadroIdsFinalizados: opts.finalizados ?? [],
    estado: opts.estado ?? 'en_progreso',
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
    const map = buildEstadoPorCuadro([tareaManual('1', 'FOA-5', { finalizados: ['FOA-5'] })])
    const estado = map.get('FOA-5')
    assert.equal(estado?.pendiente, false)
    assert.equal(estado?.cuadroFinalizado, true)
  })
})

describe('buildEstadoPorCuadroParaMapa — solape poda cerrada + alambre abierta', () => {
  const cuadroId = 'FOA-5'
  const podaCerrada = tareaManual('poda', cuadroId, {
    tarea: 'Podando',
    estado: 'finalizada',
  })
  const alambreAbierta = tareaManual('alambre', cuadroId, {
    tarea: 'Movimiento de alambres',
    estado: 'en_progreso',
  })
  const tareas = [podaCerrada, alambreAbierta]

  it('filtro Podando → gris (finalizado, no pendiente)', () => {
    const estado = buildEstadoPorCuadroParaMapa(tareas, 'Podando').get(cuadroId)
    assert.equal(estado?.pendiente, false)
    assert.equal(estado?.cuadroFinalizado, true)
  })

  it('filtro Movimiento de alambres → verde (pendiente)', () => {
    const estado = buildEstadoPorCuadroParaMapa(tareas, 'Movimiento de alambres').get(cuadroId)
    assert.equal(estado?.pendiente, true)
  })

  it('filtro todas → múltiples labores (púrpura)', () => {
    const estado = buildEstadoPorCuadroParaMapa(tareas, 'todas').get(cuadroId)
    assert.equal(estado?.multiplesLabores, true)
    assert.equal(estado?.pendiente, true)
    assert.equal(estado?.cuadroFinalizado, true)
  })

  it('dos labores cerradas también marcan múltiples', () => {
    const ambasCerradas = [
      tareaManual('a', cuadroId, { tarea: 'Podando', estado: 'finalizada' }),
      tareaManual('b', cuadroId, { tarea: 'Desbrote', estado: 'finalizada' }),
    ]
    const estado = buildEstadoPorCuadro(ambasCerradas).get(cuadroId)
    assert.equal(estado?.multiplesLabores, true)
    assert.equal(estado?.pendiente, false)
  })

  it('una sola labor no marca múltiples', () => {
    const estado = buildEstadoPorCuadro([
      tareaManual('1', cuadroId, { tarea: 'Podando', estado: 'en_progreso' }),
    ]).get(cuadroId)
    assert.equal(estado?.multiplesLabores, false)
  })
})
