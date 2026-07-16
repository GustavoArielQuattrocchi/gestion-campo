import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Tarea, ParteDeLabores } from '../types.ts'
import {
  computeDailyProductivity,
  chartTotalsByDay,
  chartRatiosByDay,
} from './analyticsAggregations.ts'

const ts = (iso: string) =>
  ({ toDate: () => new Date(iso) }) as import('firebase/firestore').Timestamp

function manualConRendimiento(
  id: string,
  labor: string,
  personas: number,
  cantidad: number,
  unidad: 'hileras' | 'jornal' | 'plantas',
  fechaIso: string,
  parteId?: string,
): Tarea {
  return {
    id,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tipo: 'manual',
    tarea: labor,
    cuadrilla: 'Propia',
    cantidadPersonas: personas,
    cuadros: ['C1'],
    cuadroIds: ['FOA-1'],
    estado: 'en_progreso',
    operador: 'op',
    fechaInicio: ts(fechaIso),
    rendimientosDiarios: [
      {
        fecha: ts(fechaIso),
        texto: `${cantidad} ${unidad}`,
        operador: 'op',
        cantidad,
        unidad,
        ...(parteId ? { parteId } : {}),
      },
    ],
  }
}

function mecanicaConRendimiento(
  id: string,
  labor: string,
  cantidad: number,
  unidad: 'hileras' | 'jornal',
  fechaIso: string,
): Tarea {
  return {
    id,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tipo: 'mecanica',
    tarea: labor,
    persona: 'Juan',
    maquinaria: 'MT27',
    cuadros: ['C1'],
    cuadroIds: ['FOA-1'],
    estado: 'en_progreso',
    operador: 'op',
    fechaInicio: ts(fechaIso),
    rendimientosDiarios: [
      {
        fecha: ts(fechaIso),
        texto: `${cantidad} ${unidad}`,
        operador: 'op',
        cantidad,
        unidad,
      },
    ],
  }
}

describe('computeDailyProductivity', () => {
  it('usa personas de la tarea cuando no hay unidad jornal', () => {
    const rows = computeDailyProductivity([
      manualConRendimiento('1', 'Podando', 6, 12, 'hileras', '2026-06-15T12:00:00Z'),
    ])
    assert.equal(rows.length, 1)
    assert.equal(rows[0].jornalesTotales, 6)
    assert.equal(rows[0].ratioByUnit.hileras, 2)
    assert.equal(rows[0].totalByUnit.hileras, 12)
  })

  it('prioriza unidad jornal explícita sobre personas', () => {
    const rows = computeDailyProductivity([
      manualConRendimiento('1', 'Podando', 6, 8, 'jornal', '2026-06-15T12:00:00Z'),
      {
        ...manualConRendimiento('1b', 'Podando', 6, 16, 'hileras', '2026-06-15T12:00:00Z'),
        id: '1b',
      },
    ])
    // Same labor+day merge: jornal 8 + hileras 16
    const row = rows.find(r => r.tarea === 'Podando')
    assert.ok(row)
    assert.equal(row!.jornalesTotales, 8)
    assert.equal(row!.ratioByUnit.hileras, 2)
  })

  it('usa cantidadPersonas del parte si hay parteId', () => {
    const partes: ParteDeLabores[] = [
      {
        id: 'p1',
        tareaId: '1',
        fincaId: 'FOA',
        fincaNombre: 'FOA',
        tarea: 'Podando',
        tipo: 'manual',
        operador: 'op',
        estado: 'cerrado',
        abiertoEn: ts('2026-06-15T08:00:00Z'),
        cerradoEn: ts('2026-06-15T18:00:00Z'),
        cuadros: [],
        cantidadPersonas: 4,
        cuadrilla: 'Propia',
      },
    ]
    const rows = computeDailyProductivity(
      [manualConRendimiento('1', 'Podando', 10, 20, 'hileras', '2026-06-15T12:00:00Z', 'p1')],
      partes,
    )
    assert.equal(rows[0].jornalesTotales, 4)
    assert.equal(rows[0].ratioByUnit.hileras, 5)
  })

  it('cuenta 1 jornal por cierre mecánico', () => {
    const rows = computeDailyProductivity([
      mecanicaConRendimiento('m1', 'Rastra', 30, 'hileras', '2026-06-15T12:00:00Z'),
    ])
    assert.equal(rows[0].jornalesTotales, 1)
    assert.equal(rows[0].ratioByUnit.hileras, 30)
  })

  it('agrega gráficos por día sumando labores', () => {
    const rows = computeDailyProductivity([
      manualConRendimiento('1', 'Podando', 4, 8, 'hileras', '2026-06-15T12:00:00Z'),
      manualConRendimiento('2', 'Desbrotar', 2, 4, 'hileras', '2026-06-15T12:00:00Z'),
    ])
    const totals = chartTotalsByDay(rows, 'hileras')
    assert.equal(totals.length, 1)
    assert.equal(totals[0].value, 12)
    const ratios = chartRatiosByDay(rows, 'hileras')
    assert.equal(ratios[0].value, 2) // 12 / (4+2)
  })
})

describe('listTareasPorRecencia', () => {
  it('ordena por actividad más reciente primero', async () => {
    const { listTareasPorRecencia } = await import('./analyticsAggregations.ts')
    const tareas = [
      manualConRendimiento('1', 'Podando', 4, 8, 'hileras', '2026-06-10T12:00:00Z'),
      manualConRendimiento('2', 'Desbrotar', 2, 4, 'hileras', '2026-06-20T12:00:00Z'),
    ]
    const ordered = listTareasPorRecencia(tareas)
    assert.deepEqual(ordered, ['Desbrotar', 'Podando'])
  })
})
