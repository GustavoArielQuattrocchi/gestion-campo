import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getCuadroDetalleById } from '../data/fincaData'

describe('getCuadroDetalleById', () => {
  it('resuelve cuadro del catálogo unificado con extras del mapa', () => {
    const cuadro = getCuadroDetalleById('FOA-5')
    assert.ok(cuadro)
    assert.equal(cuadro?.nombre, 'Cuartel 5')
    assert.equal(cuadro?.variedad, 'Chardonnay')
    assert.ok(cuadro?.extras && cuadro.extras.Pie)
  })

  it('incluye cuadros solo presentes en el mapa', () => {
    const cuadro = getCuadroDetalleById('FOA-1')
    assert.ok(cuadro)
    assert.equal(cuadro?.finca, 'FOA')
  })

  it('devuelve null si no existe', () => {
    assert.equal(getCuadroDetalleById('NO-EXISTE'), null)
  })
})
