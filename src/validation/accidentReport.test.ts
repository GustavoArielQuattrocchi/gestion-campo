import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateAccidentReport } from './accidentReport'

describe('validateAccidentReport', () => {
  it('acepta informe válido', () => {
    const result = validateAccidentReport({
      operador: 'Juan',
      fincaId: 'FOA',
      fincaNombre: 'Finca Ocho A',
      descripcion: 'Cable suelto en cuadro 5',
      tieneFoto: true,
    })
    assert.equal(result.success, true)
  })

  it('rechaza sin descripción', () => {
    const result = validateAccidentReport({
      operador: 'Juan',
      fincaId: 'FOA',
      fincaNombre: 'Finca Ocho A',
      descripcion: '   ',
      tieneFoto: false,
    })
    assert.equal(result.success, false)
    if (!result.success) assert.match(result.reason, /descripción/i)
  })
})
