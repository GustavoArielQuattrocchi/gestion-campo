import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tarea } from '../types'
import {
  agruparTareasCuadro,
  formatTareaEjecutor,
  tareaIncluyeCuadro,
} from './cuadroTareas'

function mockTs(date: string) {
  return { toDate: () => new Date(date) } as Tarea['fechaInicio']
}

function tareaManual(overrides: Partial<Tarea> & { id: string }): Tarea {
  return {
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tarea: 'Poda',
    cuadros: ['Cuartel 5'],
    cuadroIds: ['FOA-5'],
    estado: 'en_progreso',
    operador: 'Juan',
    fechaInicio: mockTs('2024-06-01T10:00:00'),
    tipo: 'manual',
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 5,
    ...overrides,
  } as Tarea
}

describe('tareaIncluyeCuadro', () => {
  it('coincide por cuadroIds', () => {
    const t = tareaManual({ id: '1' })
    assert.equal(tareaIncluyeCuadro(t, 'FOA', 'FOA-5'), true)
    assert.equal(tareaIncluyeCuadro(t, 'FOA', 'FOA-6'), false)
  })

  it('coincide por nombre de cuadro legacy', () => {
    const t = tareaManual({
      id: '2',
      cuadroIds: undefined,
      cuadros: ['Cuartel 5'],
    })
    assert.equal(tareaIncluyeCuadro(t, 'FOA', 'FOA-5'), true)
  })
})

describe('formatTareaEjecutor', () => {
  it('resume cuadrilla propia o externa', () => {
    assert.equal(formatTareaEjecutor(tareaManual({ id: '1' })), 'Cuadrilla propia')
    assert.equal(
      formatTareaEjecutor(tareaManual({ id: '2', cuadrilla: 'Cuadrilla Externa' })),
      'Cuadrilla externa',
    )
  })

  it('usa persona en mecánica', () => {
    const t = tareaManual({
      id: '3',
      tipo: 'mecanica',
      persona: 'Carlos',
      maquinaria: 'Tractor',
    } as Partial<Tarea> & { id: string })
    assert.equal(formatTareaEjecutor(t), 'Carlos')
  })
})

describe('agruparTareasCuadro', () => {
  it('separa en progreso y finalizadas', () => {
    const grupos = agruparTareasCuadro([
      tareaManual({ id: '1', estado: 'en_progreso' }),
      tareaManual({ id: '2', estado: 'finalizada', fechaFin: mockTs('2024-06-02T10:00:00') }),
    ])
    assert.equal(grupos.enProgreso.length, 1)
    assert.equal(grupos.finalizadas.length, 1)
  })
})
