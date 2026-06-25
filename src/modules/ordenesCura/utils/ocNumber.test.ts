import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateOcNumber } from './ocNumber.ts'

const existing = [
  { oc: 'OC-FOA-2026-0001', finca: 'FOA' },
  { oc: 'OC-FOA-2026-0002', finca: 'FOA' },
  { oc: 'OC-FLP-2026-0001', finca: 'FLP' },
  { oc: 'OC-FOA-2025-0099', finca: 'FOA' },
]

describe('generateOcNumber', () => {
  it('incrementa el contador por finca y año', () => {
    const next = generateOcNumber(existing, 'FOA', new Date('2026-06-25'))
    assert.equal(next, 'OC-FOA-2026-0003')
  })

  it('usa contador independiente para otra finca', () => {
    const next = generateOcNumber(existing, 'FLP', new Date('2026-06-25'))
    assert.equal(next, 'OC-FLP-2026-0002')
  })

  it('reinicia el contador en un año nuevo', () => {
    const next = generateOcNumber(existing, 'FOA', new Date(2027, 0, 1))
    assert.equal(next, 'OC-FOA-2027-0001')
  })

  it('devuelve vacío sin finca', () => {
    assert.equal(generateOcNumber(existing, ''), '')
  })
})
