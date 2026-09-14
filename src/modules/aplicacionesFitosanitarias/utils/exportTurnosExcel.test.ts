import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Timestamp } from 'firebase/firestore'
import type { AplicacionFitosanitaria } from '../types.ts'
import {
  buildGastosExcelRows,
  buildTurnosExcelRows,
  buildTurnosExcelXml,
} from './exportTurnosExcel.ts'

function ts(iso: string): Timestamp {
  return { toDate: () => new Date(iso) } as Timestamp
}

function turno(patch: Partial<AplicacionFitosanitaria> & Pick<AplicacionFitosanitaria, 'id' | 'fecha'>): AplicacionFitosanitaria {
  return {
    owner_id: 'u1',
    ordenId: 'oc1',
    oc: 'OC-FOA-2026-0001',
    finca: 'FOA',
    fincaCatalogo: 'FOA',
    cultivo: 'VID',
    volumenLitros: 800,
    vol_aplicacion: 400,
    vol_maquinaria: 800,
    cuadros: [{ cuadroId: 'c1', nombre: 'Lote A', hileras: 20, canopia_hil: 160, canopia_ha: 4000, haEstimada: 0.8 }],
    haTotal: 1.6,
    productos: [
      {
        producto: 'Cobre',
        ia: 'Cu',
        presentacion: 'L',
        dosisHaReceta: 2,
        dosisMaquinada: '4 L',
        gasto: 4,
        dosisRealHa: 2.5,
      },
    ],
    registrado_por: 'ana@salentein.com',
    created_at: patch.fecha,
    updated_at: patch.fecha,
    ...patch,
  }
}

describe('exportTurnosExcel', () => {
  it('arma una fila por turno con quien cargó, fecha y resumen de gasto', () => {
    const rows = buildTurnosExcelRows([
      turno({
        id: 't2',
        fecha: ts('2026-09-02T12:00:00Z'),
        registrado_por: 'juan@salentein.com',
      }),
      turno({
        id: 't1',
        fecha: ts('2026-09-01T12:00:00Z'),
        volumenLitros: 400,
        haTotal: 0.8,
      }),
    ])

    assert.equal(rows.length, 2)
    assert.equal(rows[0]?.fecha, new Date('2026-09-01T12:00:00Z').toLocaleDateString('es-AR'))
    assert.equal(rows[0]?.cargo, 'ana')
    assert.equal(rows[0]?.litros, 400)
    assert.equal(rows[0]?.haAplicadas, 0.8)
    assert.match(rows[0]?.productos ?? '', /Cobre: 4 L/)
    assert.equal(rows[1]?.cargo, 'juan')
  })

  it('arma una fila por producto de cada turno', () => {
    const rows = buildGastosExcelRows([
      turno({
        id: 't1',
        fecha: ts('2026-09-01T12:00:00Z'),
        productos: [
          {
            producto: 'Cobre',
            ia: 'Cu',
            presentacion: 'L',
            dosisHaReceta: 2,
            dosisMaquinada: '',
            gasto: 4,
            dosisRealHa: 2.5,
          },
          {
            producto: 'Azufre',
            ia: 'S',
            presentacion: 'kg',
            dosisHaReceta: 3,
            dosisMaquinada: '',
            gasto: 8,
            dosisRealHa: 5,
          },
        ],
      }),
    ])

    assert.deepEqual(
      rows.map(r => `${r.producto}:${r.gasto}:${r.unidad}:${r.cargo}`),
      ['Cobre:4:L:ana', 'Azufre:8:kg:ana'],
    )
  })

  it('genera XML con las dos hojas', () => {
    const xml = buildTurnosExcelXml([
      turno({ id: 't1', fecha: ts('2026-09-01T12:00:00Z') }),
    ])
    assert.match(xml, /ss:Name="Turnos"/)
    assert.match(xml, /ss:Name="Gastos"/)
    assert.match(xml, /Cobre/)
    assert.match(xml, /ss:Type="Number">4</)
  })
})
