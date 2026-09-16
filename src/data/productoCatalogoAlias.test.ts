import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { catalogoDesdeArchivo } from './agroQuimicos.ts'
import {
  canonicalizarProducto,
  convertirCantidad,
  claveProducto,
  resolverNombreCatalogo,
} from './productoCatalogoAlias.ts'
import { acumularGastoProductos } from '../utils/aplicacionFitosanitaria.ts'

describe('productoCatalogoAlias', () => {
  const catalogo = catalogoDesdeArchivo()

  it('resuelve nombres históricos al catálogo', () => {
    assert.equal(resolverNombreCatalogo('Alltec Ultra (Activador Bio)', catalogo)?.nombre, 'Activador bio')
    assert.equal(resolverNombreCatalogo('Flumoxazin', catalogo)?.nombre, 'Gemmit Top (SC)')
    assert.equal(resolverNombreCatalogo('Gemmit Top', catalogo)?.nombre, 'Gemmit Top (SC)')
    assert.equal(resolverNombreCatalogo('Round Up Control Max', catalogo)?.nombre, 'Roundup Control Max (SL)')
    assert.equal(resolverNombreCatalogo('Roundup Control Max (SG)', catalogo)?.nombre, 'Roundup Control Max (SL)')
    assert.equal(claveProducto('Round Up Control Max'), 'round up control max')
  })

  it('convierte ml a L y deja kg si el catálogo pide litros', () => {
    const aL = convertirCantidad(28329.8, 'ml', 'L')
    assert.equal(aL.unidad, 'L')
    assert.equal(aL.value, 28.3298)
    const kg = convertirCantidad(205.8, 'kg', 'L')
    assert.equal(kg.unidad, 'kg')
    assert.equal(kg.factor, 1)
    assert.equal(kg.value, 205.8)
    const cc = convertirCantidad(1886.1, 'ml', 'cc')
    assert.equal(cc.unidad, 'cc')
    assert.equal(cc.factor, 1)
  })

  it('unifica el resumen de la captura', () => {
    const total = acumularGastoProductos([
      {
        productos: [
          { producto: 'Activador bio', presentacion: 'ml', gasto: 1886.1 },
          { producto: 'Activador bio', presentacion: 'cc', gasto: 10953 },
          { producto: 'Alltec Ultra (Activador Bio)', presentacion: 'ml', gasto: 5131.1 },
          { producto: 'Flumoxazin', presentacion: 'lts', gasto: 29.2 },
          { producto: 'Gemmit Top', presentacion: 'lts', gasto: 53.4 },
          { producto: 'Gemmit Top (SC)', presentacion: 'ml', gasto: 28329.8 },
          { producto: 'Round Up Control Max', presentacion: 'kg', gasto: 205.8 },
          { producto: 'Roundup Control Max (SG)', presentacion: 'kg', gasto: 94.1 },
          { producto: 'Virantra (SC)', presentacion: 'ml', gasto: 1172.5 },
        ],
      },
    ])
    assert.deepEqual(
      total.map(p => `${p.producto}|${p.presentacion}|${p.gasto}`),
      [
        'Activador bio|cc|17970.2',
        'Gemmit Top (SC)|L|110.9',
        'Roundup Control Max (SL)|kg|299.9',
        'Virantra (SC)|cc|1172.5',
      ],
    )
  })

  it('rellena I.A. del catálogo al canonicalizar', () => {
    const gemmit = canonicalizarProducto(
      { nombre: 'Flumoxazin', presentacion: 'lts', ia: 'Flumoxazin', dosisHa: 0.15 },
      catalogo,
    )
    assert.equal(gemmit.nombre, 'Gemmit Top (SC)')
    assert.equal(gemmit.presentacion, 'L')
    assert.equal(gemmit.ia, 'Flumioxazin')
    assert.equal(gemmit.dosisHa, 0.15)
  })
})
