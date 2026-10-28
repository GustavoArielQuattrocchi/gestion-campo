import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeDosisAplicacion } from './dosis.ts'

describe('computeDosisAplicacion', () => {
  it('multiplica dosis/ha por superficie y redondea a 1 decimal', () => {
    assert.equal(computeDosisAplicacion('2', '6'), '12.0')
    assert.equal(computeDosisAplicacion('0.33', '5'), '1.7')
    assert.equal(computeDosisAplicacion('1,5', '2'), '3.0')
  })

  it('queda vacía si falta dosis/ha o superficie', () => {
    assert.equal(computeDosisAplicacion('', '5'), '')
    assert.equal(computeDosisAplicacion('2', ''), '')
    assert.equal(computeDosisAplicacion('2', '   '), '')
    assert.equal(computeDosisAplicacion('   ', '4'), '')
    assert.equal(computeDosisAplicacion('abc', '4'), '')
    assert.equal(computeDosisAplicacion('2', 'ha'), '')
  })
})
