import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AGRO_CATEGORIAS,
  catalogoDesdeArchivo,
  findProductoCatalogo,
  groupCatalogo,
  mergeCatalogo,
  nextAgroCodigo,
  type ProductoCatalogoVista,
} from './agroQuimicos.ts'

function extra(patch: Partial<ProductoCatalogoVista> & Pick<ProductoCatalogoVista, 'id' | 'nombre'>): ProductoCatalogoVista {
  return {
    codigo: 99,
    categoria: 'Herbicida',
    ia: 'Test',
    presentacion: 'L',
    dosis_ha: '2',
    description: '',
    management: 'Convencional',
    origen: 'extra',
    ...patch,
  }
}

describe('catálogo agroquímicos', () => {
  it('expone los grupos en orden y ids únicos', () => {
    const list = catalogoDesdeArchivo()
    assert.equal(AGRO_CATEGORIAS[0], 'Fungicida')
    assert.ok(list.length >= 44)
    const ids = new Set(list.map(p => p.codigo))
    assert.equal(ids.size, list.length)
    assert.equal(list[0]?.origen, 'static')
    assert.equal(list[0]?.id, 'static-1')
  })

  it('asigna el siguiente código al máximo + 1', () => {
    assert.equal(nextAgroCodigo([1, 44, 12]), 45)
    assert.equal(nextAgroCodigo([]), 1)
  })

  it('mezcla extras y ignora duplicados de nombre del archivo', () => {
    const base = catalogoDesdeArchivo()
    const merged = mergeCatalogo(base, [
      extra({ id: 'fs-1', nombre: 'Verno (FG)', categoria: 'Herbicida' }),
      extra({ id: 'fs-2', nombre: 'Nuevo foliar', categoria: 'Bioestimulante', codigo: 80 }),
    ])
    assert.equal(merged.find(p => p.nombre === 'Verno (FG)')?.origen, 'static')
    assert.equal(merged.find(p => p.nombre === 'Nuevo foliar')?.origen, 'extra')
  })

  it('agrupa respetando el orden de categorías', () => {
    const grupos = groupCatalogo(catalogoDesdeArchivo())
    assert.deepEqual(
      grupos.map(g => g.categoria),
      [...AGRO_CATEGORIAS],
    )
  })

  it('encuentra producto por nombre sin importar mayúsculas', () => {
    const match = findProductoCatalogo(catalogoDesdeArchivo(), '  coragen (sc) ')
    assert.equal(match?.nombre, 'Coragen (SC)')
    assert.equal(match?.presentacion, 'cc')
    assert.equal(findProductoCatalogo(catalogoDesdeArchivo(), ''), undefined)
  })
})
