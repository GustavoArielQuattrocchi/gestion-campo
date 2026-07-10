import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ParteDeLabores } from '../types'
import {
  computeDotacionHoy,
  computeDotacionPorFinca,
  computeDotacionPromedioDiario,
  personasEnParte,
  parteDotacionFecha,
} from './dotacion'

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as ParteDeLabores['abiertoEn']
}

function parte(overrides: Partial<ParteDeLabores> & { id: string }): ParteDeLabores {
  const abiertoEn = mockTs('2024-07-10T08:00:00')
  return {
    tareaId: '1',
    fincaId: 'foa',
    fincaNombre: 'Finca Ocho A',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    estado: 'cerrado',
    abiertoEn,
    rendimiento: '10 hileras',
    cuadros: [],
    cuadrilla: 'C1',
    cantidadPersonas: 8,
    cerradoEn: mockTs('2024-07-10T18:00:00'),
    ...overrides,
  }
}

describe('personasEnParte', () => {
  it('manual usa cantidadPersonas', () => {
    assert.equal(personasEnParte(parte({ id: '1', cantidadPersonas: 6 })), 6)
    assert.equal(personasEnParte(parte({ id: '2', cantidadPersonas: 0 })), 0)
  })

  it('mecánica cuenta 1 persona por parte', () => {
    assert.equal(
      personasEnParte(
        parte({
          id: 'm1',
          tipo: 'mecanica',
          persona: 'Pedro',
          maquinaria: 'Tractor',
        }),
      ),
      1,
    )
    assert.equal(
      personasEnParte(
        parte({
          id: 'm2',
          tipo: 'mecanica',
          persona: undefined,
          maquinaria: 'Tractor',
        }),
      ),
      1,
    )
  })
})

describe('parteDotacionFecha', () => {
  it('usa fecha de apertura aunque el cierre sea otro día', () => {
    const p = parte({
      id: 'v1',
      abiertoEn: mockTs('2024-07-08T08:00:00'),
      cerradoEn: mockTs('2024-07-12T18:00:00'),
    })
    assert.equal(parteDotacionFecha(p), '2024-07-08')
  })
})

describe('computeDotacionHoy', () => {
  it('suma manual y mecánica del día de apertura', () => {
    const hoy = '2026-07-10'
    const partes = [
      parte({ id: '1', cantidadPersonas: 5, abiertoEn: mockTs(`${hoy}T08:00:00`) }),
      parte({
        id: '2',
        tipo: 'mecanica',
        persona: 'Ana',
        maquinaria: 'Tractor',
        abiertoEn: mockTs(`${hoy}T09:00:00`),
      }),
      parte({ id: '3', cantidadPersonas: 3, abiertoEn: mockTs('2024-06-01T08:00:00') }),
    ]
    assert.equal(computeDotacionHoy(partes, new Date(`${hoy}T12:00:00`)), 6)
  })
})

describe('computeDotacionPorFinca', () => {
  it('agrupa por finca en la fecha indicada', () => {
    const fecha = '2024-07-10'
    const partes = [
      parte({ id: '1', fincaNombre: 'Finca A', cantidadPersonas: 4, abiertoEn: mockTs(`${fecha}T08:00:00`) }),
      parte({ id: '2', fincaNombre: 'Finca B', cantidadPersonas: 2, abiertoEn: mockTs(`${fecha}T08:00:00`) }),
      parte({ id: '3', fincaNombre: 'Finca A', cantidadPersonas: 3, abiertoEn: mockTs(`${fecha}T08:00:00`) }),
    ]
    const resumen = computeDotacionPorFinca(partes, fecha)
    assert.equal(resumen.length, 2)
    assert.deepEqual(resumen.find(r => r.finca === 'Finca A'), { finca: 'Finca A', personas: 7 })
    assert.deepEqual(resumen.find(r => r.finca === 'Finca B'), { finca: 'Finca B', personas: 2 })
  })
})

describe('computeDotacionPromedioDiario', () => {
  it('promedia personas por día con actividad', () => {
    const partes = [
      parte({ id: '1', cantidadPersonas: 10, abiertoEn: mockTs('2024-07-01T08:00:00') }),
      parte({ id: '2', cantidadPersonas: 6, abiertoEn: mockTs('2024-07-01T14:00:00') }),
      parte({ id: '3', cantidadPersonas: 4, abiertoEn: mockTs('2024-07-02T08:00:00') }),
    ]
    assert.equal(computeDotacionPromedioDiario(partes), '10.0')
  })
})
