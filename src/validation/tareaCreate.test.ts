import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateManualTaskCreate, validateMechanicalTaskCreate } from './tareaCreate'

const cuadrosOk = { cuadros: ['Cuartel 5'], cuadroIds: ['FOA-5'] }

describe('validateManualTaskCreate', () => {
  it('acepta payload válido', () => {
    const result = validateManualTaskCreate({
      cuadrilla: 'Cuadrilla A',
      tarea: 'Poda',
      cantidadPersonas: 8,
      ...cuadrosOk,
    })
    assert.equal(result.success, true)
  })

  it('rechaza sin cuadrilla', () => {
    const result = validateManualTaskCreate({
      cuadrilla: '',
      tarea: 'Poda',
      cantidadPersonas: 8,
      ...cuadrosOk,
    })
    assert.equal(result.success, false)
  })

  it('rechaza cantidadPersonas inválida', () => {
    const result = validateManualTaskCreate({
      cuadrilla: 'Cuadrilla A',
      tarea: 'Poda',
      cantidadPersonas: 0,
      ...cuadrosOk,
    })
    assert.equal(result.success, false)
  })

  it('acepta alcance finca sin cuadros', () => {
    const result = validateManualTaskCreate({
      cuadrilla: 'Cuadrilla A',
      tarea: 'Poda de raíces',
      cantidadPersonas: 8,
      cuadros: [],
      cuadroIds: [],
      alcance: 'finca',
    })
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.data.alcance, 'finca')
    assert.deepEqual(result.data.cuadros, [])
    assert.deepEqual(result.data.cuadroIds, [])
  })

  it('sigue exigiendo cuadros si no es toda la finca', () => {
    const result = validateManualTaskCreate({
      cuadrilla: 'Cuadrilla A',
      tarea: 'Poda',
      cantidadPersonas: 8,
      cuadros: [],
      cuadroIds: [],
    })
    assert.equal(result.success, false)
  })
})

describe('validateMechanicalTaskCreate', () => {
  it('acepta payload válido', () => {
    const result = validateMechanicalTaskCreate({
      tarea: 'Rastra',
      persona: 'Pedro',
      maquinaria: 'Tractor',
      ...cuadrosOk,
    })
    assert.equal(result.success, true)
  })

  it('rechaza sin maquinaria', () => {
    const result = validateMechanicalTaskCreate({
      tarea: 'Rastra',
      persona: 'Pedro',
      maquinaria: '',
      ...cuadrosOk,
    })
    assert.equal(result.success, false)
  })
})
