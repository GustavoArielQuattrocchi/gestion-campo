import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Timestamp } from 'firebase/firestore'
import {
  countAccidentesPorFinca,
  countNaturalezasLesion,
  countPartesCuerpo,
  filterInformesCompletos,
  formatYearMonthLabel,
  rankAfectados,
  yearMonthKey,
} from './accidentAnalytics'
import { isInformeCompleto, parseInformeAccidente, type InformeAccidenteCompleto } from './parseInformeAccidente'

function ts(iso: string): Timestamp {
  const d = new Date(iso)
  return { toDate: () => d, seconds: Math.floor(d.getTime() / 1000) } as Timestamp
}

function completo(overrides: Partial<InformeAccidenteCompleto> & { id: string }): InformeAccidenteCompleto {
  return {
    operador: 'Juan',
    fincaId: 'FOA',
    fincaNombre: 'Finca Ocho A',
    descripcion: 'Caída',
    tieneFoto: false,
    creadoEn: ts('2026-08-10T12:00:00'),
    afectadoNombre: 'Pedro Gómez',
    afectadoDni: '32456789',
    partesCuerpo: ['manos'],
    parteCuerpoOtro: '',
    naturalezasLesion: ['contusion'],
    naturalezaLesionOtro: '',
    tipo: 'manual',
    tarea: 'Podando',
    ...overrides,
  }
}

describe('parseInformeAccidente', () => {
  it('acepta informe legacy sin checklist', () => {
    const parsed = parseInformeAccidente('a1', {
      operador: 'Juan',
      fincaId: 'FOA',
      fincaNombre: 'Finca Ocho A',
      descripcion: 'Cable suelto',
      tieneFoto: false,
      creadoEn: ts('2026-07-01T10:00:00'),
    })
    assert.ok(parsed)
    assert.equal(isInformeCompleto(parsed!), false)
  })

  it('marca completo el informe nuevo', () => {
    const parsed = parseInformeAccidente('a2', {
      operador: 'Juan',
      fincaId: 'FOA',
      fincaNombre: 'Finca Ocho A',
      descripcion: 'Caída',
      tieneFoto: true,
      creadoEn: ts('2026-08-10T12:00:00'),
      afectadoNombre: 'Pedro',
      afectadoDni: '32456789',
      partesCuerpo: ['manos'],
      parteCuerpoOtro: '',
      naturalezasLesion: ['corte'],
      naturalezaLesionOtro: '',
      tipo: 'manual',
      tarea: 'Podando',
    })
    assert.ok(parsed)
    assert.equal(isInformeCompleto(parsed!), true)
  })
})

describe('accidentAnalytics', () => {
  const informes = [
    completo({ id: '1', afectadoNombre: 'Pedro', afectadoDni: '111', partesCuerpo: ['manos', 'ojos'] }),
    completo({
      id: '2',
      afectadoNombre: 'Pedro Gómez',
      afectadoDni: '111',
      fincaNombre: 'Finca Los Árboles',
      partesCuerpo: ['manos'],
      naturalezasLesion: ['corte'],
    }),
    completo({
      id: '3',
      afectadoNombre: 'Ana',
      afectadoDni: '222',
      creadoEn: ts('2026-07-15T12:00:00'),
    }),
  ]

  it('filtra completos por finca y mes', () => {
    const ago = filterInformesCompletos(informes, 'todas', '2026-08')
    assert.equal(ago.length, 2)
    const foa = filterInformesCompletos(informes, 'Finca Ocho A', '2026-08')
    assert.equal(foa.length, 1)
  })

  it('cuenta fincas, partes (multi-select) y naturalezas', () => {
    const ago = filterInformesCompletos(informes, 'todas', '2026-08')
    assert.deepEqual(countAccidentesPorFinca(ago).map(p => [p.label, p.value]), [
      ['Finca Los Árboles', 1],
      ['Finca Ocho A', 1],
    ])
    const partes = countPartesCuerpo(ago)
    assert.equal(partes.find(p => p.label === 'Manos')?.value, 2)
    assert.equal(partes.find(p => p.label === 'Ojos')?.value, 1)
    assert.equal(countNaturalezasLesion(ago).find(p => p.label === 'Corte')?.value, 1)
  })

  it('rankea por DNI y resalta reiteraciones', () => {
    const ago = filterInformesCompletos(informes, 'todas', '2026-08')
    const rank = rankAfectados(ago)
    assert.equal(rank.length, 1)
    assert.equal(rank[0].dni, '111')
    assert.equal(rank[0].count, 2)
    assert.equal(rank[0].isTop, true)
    assert.equal(rank[0].nombre, 'Pedro Gómez')
  })

  it('formatea mes', () => {
    assert.equal(yearMonthKey(new Date('2026-08-10T12:00:00')), '2026-08')
    assert.equal(formatYearMonthLabel('2026-08'), 'ago 2026')
  })
})
