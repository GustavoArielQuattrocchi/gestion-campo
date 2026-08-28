import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeDosisMaquinada, computeFactor, formatNumber } from './factor.ts'

describe('computeFactor', () => {
  it('divide tanque por litros por ha', () => {
    assert.equal(computeFactor(2000, 400), 5)
  })

  it('devuelve null si aplicación es 0', () => {
    assert.equal(computeFactor(2000, 0), null)
  })
})

describe('computeDosisMaquinada', () => {
  it('redondea a 1 decimal y pega la presentación', () => {
    assert.equal(computeDosisMaquinada('2', 6, 'cc'), '12.0 cc')
    assert.equal(computeDosisMaquinada('0.33', 5, 'L'), '1.7 L')
  })

  it('acepta coma decimal en dosis/ha', () => {
    assert.equal(computeDosisMaquinada('1,5', 2, 'kg'), '3.0 kg')
  })

  it('sin presentación deja solo el número', () => {
    assert.equal(computeDosisMaquinada('2', 5, ''), '10.0')
  })

  it('vacío si no hay factor o dosis', () => {
    assert.equal(computeDosisMaquinada('2', null, 'cc'), '')
    assert.equal(computeDosisMaquinada('', 5, 'cc'), '')
  })
})

describe('formatNumber', () => {
  it('fija un decimal', () => {
    assert.equal(formatNumber(12), '12.0')
    assert.equal(formatNumber(1.66), '1.7')
  })
})
