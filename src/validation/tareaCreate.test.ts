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
