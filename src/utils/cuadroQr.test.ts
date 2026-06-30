import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildCuadroQrUrl, formatHectareas, getCuadroPublicInfo } from './cuadroQr'

describe('buildCuadroQrUrl', () => {
  it('arma la ruta pública con encoding', () => {
    const url = buildCuadroQrUrl('FOA', 'FOA-6-Malbec', 'https://example.test')
    assert.equal(url, 'https://example.test/cuadro/FOA/FOA-6-Malbec')
  })
})

describe('getCuadroPublicInfo', () => {
  it('resuelve un cuadro del catálogo', () => {
    const info = getCuadroPublicInfo('FOA', 'FOA-5')
    assert.ok(info)
    assert.equal(info?.nombre, 'Cuartel 5')
    assert.equal(info?.variedad, 'Chardonnay')
  })

  it('devuelve null si no existe', () => {
    assert.equal(getCuadroPublicInfo('FOA', 'NO-EXISTE'), null)
  })
})

describe('formatHectareas', () => {
  it('formatea con dos decimales', () => {
    assert.match(formatHectareas(10.2), /10,20 ha/)
  })
})
