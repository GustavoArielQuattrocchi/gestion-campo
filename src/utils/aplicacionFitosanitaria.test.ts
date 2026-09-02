import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  acumularGastoProductos,
  calcularTurno,
  catalogFincaFromOc,
  diferenciaDosis,
  dosisRealHa,
  formatCantidad,
  formatDiferenciaDosis,
  gastoProducto,
  haDesdeHileras,
  hayDiferenciaDosis,
} from './aplicacionFitosanitaria.ts'

describe('catalogFincaFromOc', () => {
  it('mapea SC2/SC3 a FC2/FC3 y deja el resto igual', () => {
    assert.equal(catalogFincaFromOc('SC2'), 'FC2')
    assert.equal(catalogFincaFromOc('sc3'), 'FC3')
    assert.equal(catalogFincaFromOc('FOA'), 'FOA')
    assert.equal(catalogFincaFromOc('FLP'), 'FLP')
  })
})

describe('haDesdeHileras', () => {
  it('estima ha con canopia: (hileras × canopia_hil) / canopia_ha', () => {
    assert.equal(haDesdeHileras(10, 160, 4000), 0.4)
    assert.equal(haDesdeHileras(40, 160, 4000), 1.6)
  })

  it('devuelve null si falta canopia o hileras', () => {
    assert.equal(haDesdeHileras(10, 0, 4000), null)
    assert.equal(haDesdeHileras(10, 160, 0), null)
    assert.equal(haDesdeHileras(0, 160, 4000), null)
    assert.equal(haDesdeHileras(-1, 160, 4000), null)
  })
})

describe('gastoProducto y dosisRealHa', () => {
  it('infiere gasto desde receta y litros de caldo', () => {
    assert.equal(gastoProducto(2, 800, 400), 4)
  })

  it('calcula dosis real por ha del turno', () => {
    assert.equal(dosisRealHa(4, 1.6), 2.5)
  })

  it('devuelve null sin volumen de aplicación o sin ha', () => {
    assert.equal(gastoProducto(2, 800, 0), null)
    assert.equal(dosisRealHa(4, 0), null)
  })
})

describe('calcularTurno', () => {
  it('suma ha de varios cuadros y calcula gasto y dosis real', () => {
    const result = calcularTurno(
      800,
      400,
      [
        { cuadroId: 'a', nombre: 'A', hileras: 20, canopia_hil: 160, canopia_ha: 4000 },
        { cuadroId: 'b', nombre: 'B', hileras: 20, canopia_hil: 160, canopia_ha: 4000 },
      ],
      [{ producto: 'Cobre', ia: '', presentacion: 'L', dosisHa: 2, dosisMaquinada: '10.0 L' }],
    )

    assert.equal(result.haTotal, 1.6)
    assert.equal(result.productos[0]?.gasto, 4)
    assert.equal(result.productos[0]?.dosisRealHa, 2.5)
    assert.equal(result.avisos.length, 0)
  })

  it('omite cuadros sin canopia y avisa', () => {
    const result = calcularTurno(
      800,
      400,
      [
        { cuadroId: 'ok', nombre: 'Ok', hileras: 10, canopia_hil: 160, canopia_ha: 4000 },
        { cuadroId: 'no', nombre: 'Sin canopia', hileras: 10, canopia_hil: 0, canopia_ha: 0 },
      ],
      [{ producto: 'Cobre', ia: '', presentacion: 'L', dosisHa: 2, dosisMaquinada: '' }],
    )

    assert.equal(result.haTotal, 0.4)
    assert.equal(result.cuadros[1]?.omitido, true)
    assert.ok(result.avisos.some(a => a.includes('Sin canopia')))
  })

  it('avisa si no hay litros o vol de aplicación', () => {
    const result = calcularTurno(0, 0, [], [])
    assert.ok(result.avisos.some(a => a.includes('litros de caldo')))
    assert.ok(result.avisos.some(a => a.includes('volumen de aplicación')))
  })
})

describe('acumularGastoProductos', () => {
  it('suma el mismo producto y unidad en varios turnos', () => {
    const total = acumularGastoProductos([
      { productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 4 }] },
      { productos: [{ producto: 'Cobre', presentacion: 'l', gasto: 2.5 }] },
    ])
    assert.equal(total.length, 1)
    assert.equal(total[0]?.producto, 'Cobre')
    assert.equal(total[0]?.gasto, 6.5)
  })

  it('separa unidades distintas y omite gasto vacío', () => {
    const total = acumularGastoProductos([
      {
        productos: [
          { producto: 'Cobre', presentacion: 'L', gasto: 4 },
          { producto: 'Azufre', presentacion: 'kg', gasto: 8 },
          { producto: 'Agua', presentacion: 'L', gasto: null },
        ],
      },
    ])
    assert.deepEqual(
      total.map(p => `${p.producto}:${p.presentacion}:${p.gasto}`),
      ['Azufre:kg:8', 'Cobre:L:4'],
    )
  })
})

describe('diferenciaDosis', () => {
  it('resta receta de real y formatea con signo y unidad', () => {
    assert.equal(diferenciaDosis(2.5, 2), 0.5)
    assert.equal(diferenciaDosis(1.5, 2), -0.5)
    assert.equal(formatDiferenciaDosis(0.5, 'L'), `+${formatCantidad(0.5)} L`)
    assert.equal(formatDiferenciaDosis(-0.5, 'kg'), `-${formatCantidad(0.5)} kg`)
    assert.equal(hayDiferenciaDosis(0.5), true)
    assert.equal(hayDiferenciaDosis(0), false)
    assert.equal(diferenciaDosis(null, 2), null)
  })
})
