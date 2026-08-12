import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidDni, validateAccidentReport, type AccidentReportInput } from './accidentReport'

function base(overrides: Partial<AccidentReportInput> = {}): AccidentReportInput {
  return {
    operador: 'Juan',
    fincaId: 'FOA',
    fincaNombre: 'Finca Ocho A',
    descripcion: 'Caída en cuadro 5',
    tieneFoto: true,
    afectadoNombre: 'Pedro Gómez',
    afectadoDni: '32.456.789',
    partesCuerpo: ['cara_cuello'],
    parteCuerpoOtro: '',
    naturalezasLesion: ['contusion'],
    naturalezaLesionOtro: '',
    tipo: 'manual',
    tarea: 'Podando',
    ...overrides,
  }
}

describe('validateAccidentReport', () => {
  it('acepta informe válido y normaliza DNI', () => {
    const result = validateAccidentReport(base())
    assert.equal(result.success, true)
    if (result.success) assert.equal(result.data.afectadoDni, '32456789')
  })

  it('rechaza sin descripción', () => {
    const result = validateAccidentReport(base({ descripcion: '   ' }))
    assert.equal(result.success, false)
    if (!result.success) assert.match(result.reason, /descripción/i)
  })

  it('rechaza sin afectado o DNI inválido', () => {
    assert.equal(validateAccidentReport(base({ afectadoNombre: '' })).success, false)
    assert.equal(validateAccidentReport(base({ afectadoDni: '123' })).success, false)
    assert.equal(isValidDni('1234567'), true)
    assert.equal(isValidDni('12.345.678'), true)
  })

  it('exige al menos una parte y una naturaleza', () => {
    assert.equal(validateAccidentReport(base({ partesCuerpo: [] })).success, false)
    assert.equal(validateAccidentReport(base({ naturalezasLesion: [] })).success, false)
  })

  it('exige texto si Otros está tildado', () => {
    const sinTexto = validateAccidentReport(base({
      partesCuerpo: ['otros'],
      parteCuerpoOtro: '',
    }))
    assert.equal(sinTexto.success, false)

    const ok = validateAccidentReport(base({
      partesCuerpo: ['otros'],
      parteCuerpoOtro: 'Hombro izquierdo',
    }))
    assert.equal(ok.success, true)
  })

  it('exige tipo y tarea del catálogo', () => {
    assert.equal(validateAccidentReport(base({ tipo: '' })).success, false)
    assert.equal(validateAccidentReport(base({ tarea: '' })).success, false)
    assert.equal(validateAccidentReport(base({ tipo: 'manual', tarea: 'Curacion' })).success, false)
    const ok = validateAccidentReport(base({ tipo: 'mecanica', tarea: 'Curacion' }))
    assert.equal(ok.success, true)
  })
})
