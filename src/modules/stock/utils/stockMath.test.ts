import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  conteoDelta,
  faltaNotaSiBaja,
  faltantesDeEgreso,
  nextSaldo,
  parseCantidadStock,
  productoKeyFromNombre,
  saldoDocId,
} from './stockMath'

describe('stockMath', () => {
  it('arma el id de saldo por depósito y producto', () => {
    assert.equal(saldoDocId('FOA', productoKeyFromNombre('Coragen (SC)')), 'FOA__coragen_(sc)')
  })

  it('el conteo guarda el delta respecto del saldo anterior', () => {
    assert.equal(conteoDelta(10, 8), -2)
    assert.equal(conteoDelta(0, 12.5), 12.5)
  })

  it('el siguiente saldo redondea a 4 decimales', () => {
    assert.equal(nextSaldo(1.2, -0.33333), 0.8667)
  })

  it('detecta faltantes al egresar un turno', () => {
    const faltantes = faltantesDeEgreso(
      [{ punto: 'FOA', productoKey: productoKeyFromNombre('Coragen (SC)'), cantidad: 2 }],
      'FOA',
      [{
        producto: 'Coragen (SC)',
        productoKey: productoKeyFromNombre('Coragen (SC)'),
        ia: 'Clorantraniliprole',
        presentacion: 'cc',
        gasto: 4,
      }],
    )
    assert.equal(faltantes.length, 1)
    assert.equal(faltantes[0].disponible, 2)
    assert.equal(faltantes[0].solicitado, 4)
  })

  it('parsea cantidad con coma', () => {
    assert.equal(parseCantidadStock('12,5'), 12.5)
    assert.equal(parseCantidadStock('-1'), null)
  })

  it('exige nota solo si el saldo baja', () => {
    assert.equal(faltaNotaSiBaja(10, 8, ''), true)
    assert.equal(faltaNotaSiBaja(10, 8, 'merma'), false)
    assert.equal(faltaNotaSiBaja(10, 12, ''), false)
  })
})
