import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateOcNumber, generateOrdenNumber } from './ocNumber.ts'

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

  it('cuenta una OF de la misma finca y año', () => {
    const next = generateOcNumber(
      [...existing, { oc: 'OF-FOA-2026-0010', finca: 'FOA' }],
      'FOA',
      new Date('2026-06-25'),
    )
    assert.equal(next, 'OC-FOA-2026-0011')
  })
})

describe('correlativo compartido OC/OF', () => {
  const fecha = new Date(2026, 5, 25)

  it('no repite el entero entre cura y fertilización de la misma finca y año', () => {
    const soloCura = [{ codigo: 'OC-Pie de Palo-2026-0003', finca: 'Pie de Palo' }]
    assert.equal(
      generateOrdenNumber(soloCura, 'Pie de Palo', 'OF', fecha),
      'OF-Pie de Palo-2026-0004',
    )

    const conFertilizacion = [
      ...soloCura,
      { codigo: 'OF-Pie de Palo-2026-0004', finca: 'Pie de Palo' },
    ]
    assert.equal(
      generateOrdenNumber(conFertilizacion, 'Pie de Palo', 'OC', fecha),
      'OC-Pie de Palo-2026-0005',
    )
    assert.equal(
      generateOcNumber(
        conFertilizacion.map(orden => ({ oc: orden.codigo, finca: orden.finca })),
        'Pie de Palo',
        fecha,
      ),
      'OC-Pie de Palo-2026-0005',
    )
  })

  it('no mezcla otra finca ni otro año', () => {
    const ordenes = [
      { codigo: 'OC-Pie de Palo-2026-0003', finca: 'Pie de Palo' },
      { codigo: 'OF-FOA-2026-0009', finca: 'FOA' },
      { codigo: 'OF-Pie de Palo-2025-0008', finca: 'Pie de Palo' },
      { codigo: 'OC-Pie de Palo-2027-0002', finca: 'Pie de Palo' },
    ]
    assert.equal(
      generateOrdenNumber(ordenes, 'Pie de Palo', 'OF', fecha),
      'OF-Pie de Palo-2026-0004',
    )
    assert.equal(generateOrdenNumber(ordenes, 'FOA', 'OC', fecha), 'OC-FOA-2026-0010')
    assert.equal(
      generateOrdenNumber(ordenes, 'Pie de Palo', 'OF', new Date(2025, 0, 1)),
      'OF-Pie de Palo-2025-0009',
    )
  })

  it('empieza en 0001 si no hay órdenes de esa finca y año', () => {
    assert.equal(
      generateOrdenNumber([], 'Pie de Palo', 'OF', fecha),
      'OF-Pie de Palo-2026-0001',
    )
    assert.equal(
      generateOrdenNumber(
        [{ codigo: 'OC-FOA-2026-0004', finca: 'FOA' }],
        'Pie de Palo',
        'OC',
        fecha,
      ),
      'OC-Pie de Palo-2026-0001',
    )
  })

  it('devuelve vacío sin finca', () => {
    assert.equal(generateOrdenNumber([], '  ', 'OF', fecha), '')
  })
})
