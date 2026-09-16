import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FILTRO_CAMPANA_TODAS,
  FILTRO_FINCA_SIN,
  FILTRO_FINCA_TODAS,
  SIN_FINCA_GASTO,
  acumularGastoPorFinca,
  acumularGastoProductos,
  calcularTurno,
  campanaFromDate,
  catalogFincaFromOc,
  coincideCampana,
  coincideFincaGasto,
  desvioGasto,
  desvioGastoPct,
  diferenciaDosis,
  dosisRealHa,
  fincaGastoKey,
  formatCantidad,
  formatDesvioPorcentaje,
  formatDiferenciaDosis,
  gastoIdealProducto,
  gastoProducto,
  haDesdeHileras,
  hayDiferenciaDosis,
  listCampanas,
  listFincasGasto,
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
  it('redondea ha, gasto y dosis real a 1 decimal', () => {
    const result = calcularTurno(
      100,
      400,
      [{ cuadroId: 'a', nombre: 'A', hileras: 7, canopia_hil: 150, canopia_ha: 4000 }],
      [{ producto: 'Cobre', ia: '', presentacion: 'L', dosisHa: 1.33, dosisMaquinada: '' }],
    )

    assert.equal(result.cuadros[0]?.haEstimada, 0.3)
    assert.equal(result.haTotal, 0.3)
    assert.equal(result.productos[0]?.gasto, 0.3)
    assert.equal(result.productos[0]?.dosisRealHa, 1)
  })

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

describe('campaña vitivinícola', () => {
  it('corta en julio: junio queda en la campaña anterior', () => {
    assert.equal(campanaFromDate(new Date(2026, 6, 1)), '2026/27')
    assert.equal(campanaFromDate(new Date(2026, 5, 30)), '2025/26')
    assert.equal(campanaFromDate(new Date(2026, 8, 14)), '2026/27')
  })

  it('lista campañas de más reciente a más vieja e incluye la actual', () => {
    const list = listCampanas(
      [new Date(2025, 7, 1), new Date(2024, 2, 10)],
      new Date(2026, 8, 14),
    )
    assert.deepEqual(list, ['2026/27', '2025/26', '2023/24'])
  })

  it('filtra por campaña o deja pasar todas', () => {
    assert.equal(coincideCampana(new Date(2026, 8, 14), '2026/27'), true)
    assert.equal(coincideCampana(new Date(2026, 5, 30), '2026/27'), false)
    assert.equal(coincideCampana(new Date(2026, 5, 30), FILTRO_CAMPANA_TODAS), true)
  })
})

describe('finca unificada para gasto', () => {
  it('trata SC2 y FC2 como la misma finca', () => {
    assert.equal(fincaGastoKey('SC2'), 'FC2')
    assert.equal(fincaGastoKey('FC2'), 'FC2')
    assert.equal(fincaGastoKey('sc2', 'otra'), 'FC2')
  })

  it('usa fincaCatalogo si finca viene vacía, y vacío si no hay ninguna', () => {
    assert.equal(fincaGastoKey('', 'FOA'), 'FOA')
    assert.equal(fincaGastoKey('  ', '  '), '')
    assert.equal(fincaGastoKey(null, null), '')
  })

  it('filtra todas, una finca unificada o sin finca', () => {
    assert.equal(coincideFincaGasto('SC2', 'FC2', FILTRO_FINCA_TODAS), true)
    assert.equal(coincideFincaGasto('SC2', '', 'FC2'), true)
    assert.equal(coincideFincaGasto('FOA', 'FOA', 'FC2'), false)
    assert.equal(coincideFincaGasto('', '', FILTRO_FINCA_SIN), true)
    assert.equal(coincideFincaGasto('FOA', '', FILTRO_FINCA_SIN), false)
  })
})

describe('acumularGastoPorFinca', () => {
  it('une SC2 y FC2, suma ha aplicadas y deja Sin finca al final', () => {
    const grupos = acumularGastoPorFinca([
      {
        finca: 'FOA',
        haTotal: 1.2,
        volumenLitros: 100,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 1 }],
      },
      {
        finca: 'SC2',
        haTotal: 1,
        volumenLitros: 80,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 2 }],
      },
      {
        finca: 'FC2',
        haTotal: 2.5,
        volumenLitros: 120,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 3 }],
      },
      {
        finca: '',
        fincaCatalogo: '',
        haTotal: 0.4,
        volumenLitros: 40,
        productos: [{ producto: 'Azufre', presentacion: 'kg', gasto: 5 }],
      },
    ])

    assert.deepEqual(
      grupos.map(g => `${g.finca}:${g.haAplicadas}:${g.turnosCount}`),
      ['FC2:3.5:2', 'FOA:1.2:1', `${SIN_FINCA_GASTO}:0.4:1`],
    )
    assert.equal(grupos[0]?.litrosCaldo, 200)
    assert.equal(grupos[0]?.productos[0]?.gasto, 5)
    assert.equal(grupos[2]?.fincaKey, '')
  })

  it('calcula ideal y desvío dentro de cada finca', () => {
    const grupos = acumularGastoPorFinca([
      {
        finca: 'FOA',
        haTotal: 1.6,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 4, dosisHaReceta: 2 }],
      },
      {
        finca: 'FC2',
        haTotal: 2,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 3, dosisHaReceta: 2 }],
      },
    ])
    assert.equal(grupos[0]?.finca, 'FC2')
    assert.equal(grupos[0]?.productos[0]?.ideal, 4)
    assert.equal(grupos[0]?.productos[0]?.desvio, -1)
    assert.equal(grupos[1]?.finca, 'FOA')
    assert.equal(grupos[1]?.productos[0]?.ideal, 3.2)
    assert.equal(grupos[1]?.productos[0]?.desvio, 0.8)
  })
})

describe('listFincasGasto', () => {
  it('unifica claves, ordena alfabético y deja Sin finca al final', () => {
    const list = listFincasGasto([
      { finca: 'FOA' },
      { finca: 'SC2' },
      { finca: 'FC2' },
      { finca: '' },
      { finca: 'FLP' },
    ])
    assert.deepEqual(
      list.map(f => `${f.key || FILTRO_FINCA_SIN}:${f.label}`),
      [`FC2:FC2`, `FLP:FLP`, `FOA:FOA`, `${FILTRO_FINCA_SIN}:${SIN_FINCA_GASTO}`],
    )
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

  it('calcula ideal y desvío por producto con dosis receta × ha', () => {
    const total = acumularGastoProductos([
      {
        haTotal: 1.6,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 4, dosisHaReceta: 2 }],
      },
      {
        haTotal: 2,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 3, dosisHaReceta: 2 }],
      },
    ])
    assert.equal(total[0]?.gasto, 7)
    assert.equal(total[0]?.ideal, 7.2)
    assert.equal(total[0]?.desvio, -0.2)
    assert.equal(total[0]?.desvioPct, -2.8)
  })

  it('deja ideal y desvío vacíos si falta la dosis de receta', () => {
    const total = acumularGastoProductos([
      {
        haTotal: 1.6,
        productos: [{ producto: 'Cobre', presentacion: 'L', gasto: 4 }],
      },
    ])
    assert.equal(total[0]?.gasto, 4)
    assert.equal(total[0]?.ideal, null)
    assert.equal(total[0]?.desvio, null)
    assert.equal(total[0]?.desvioPct, null)
  })
})

describe('gastoIdealProducto', () => {
  it('multiplica dosis receta/ha por ha aplicadas', () => {
    assert.equal(gastoIdealProducto(2, 1.6), 3.2)
    assert.equal(gastoIdealProducto(null, 1.6), null)
    assert.equal(gastoIdealProducto(2, 0), null)
  })
})

describe('desvioGasto', () => {
  it('resta el ideal del gastado y arma el porcentaje', () => {
    assert.equal(desvioGasto(4, 3.2), 0.8)
    assert.equal(desvioGastoPct(0.8, 3.2), 25)
    assert.equal(desvioGasto(4, null), null)
    assert.equal(desvioGastoPct(0.8, 0), null)
    assert.equal(formatDesvioPorcentaje(25), `+${formatCantidad(25)} %`)
    assert.equal(formatDesvioPorcentaje(-2.8), `-${formatCantidad(2.8)} %`)
    assert.equal(formatDesvioPorcentaje(null), '—')
  })
})

describe('formatCantidad', () => {
  it('fija un decimal con redondeo', () => {
    const one = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const
    assert.equal(formatCantidad(1.66), (1.7).toLocaleString('es-AR', one))
    assert.equal(formatCantidad(12), (12).toLocaleString('es-AR', one))
    assert.equal(formatCantidad(null), '—')
  })
})

describe('diferenciaDosis', () => {
  it('resta receta de real y formatea con signo y unidad', () => {
    assert.equal(diferenciaDosis(2.5, 2), 0.5)
    assert.equal(diferenciaDosis(1.5, 2), -0.5)
    assert.equal(diferenciaDosis(2.14, 2), 0.1)
    assert.equal(formatDiferenciaDosis(0.5, 'L'), `+${formatCantidad(0.5)} L`)
    assert.equal(formatDiferenciaDosis(-0.5, 'kg'), `-${formatCantidad(0.5)} kg`)
    assert.equal(hayDiferenciaDosis(0.5), true)
    assert.equal(hayDiferenciaDosis(0), false)
    assert.equal(hayDiferenciaDosis(0.04), false)
    assert.equal(formatDiferenciaDosis(0.04, 'L'), '0')
    assert.equal(diferenciaDosis(null, 2), null)
  })
})
