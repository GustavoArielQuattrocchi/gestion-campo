import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ParteDeLabores } from '../types.ts'
import {
  filterPartesAbiertosVencidos,
  filterTareasConParteAbiertoHoy,
  filterTareasConParteVencido,
  isParteAbiertoHoy,
  isParteAbiertoVencido,
  resolveCerradoEn,
} from './parteEstado.ts'
import { filterTareasPendientesHoy, filterTareasPendientesVencidas } from './parteLabores.ts'
import type { TareaManual } from '../types.ts'

const mockTs = (iso: string) =>
  ({ toDate: () => new Date(iso), seconds: Math.floor(new Date(iso).getTime() / 1000) }) as import('firebase/firestore').Timestamp

const baseTarea: TareaManual = {
  id: 't1',
  fincaId: 'FOA',
  fincaNombre: 'FOA',
  tarea: 'Poda',
  cuadros: ['Cuartel 5'],
  estado: 'en_progreso',
  operador: 'Juan',
  fechaInicio: mockTs('2026-06-20T10:00:00Z'),
  tipo: 'manual',
  cuadrilla: 'Cuadrilla Propia',
  cantidadPersonas: 4,
}

function parteAbierto(tareaId: string, abiertoIso: string): ParteDeLabores {
  return {
    id: `p-${tareaId}`,
    tareaId,
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tarea: 'Poda',
    tipo: 'manual',
    operador: 'Juan',
    estado: 'abierto',
    abiertoEn: mockTs(abiertoIso),
    cuadros: [],
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 4,
  }
}

describe('parteEstado vencidos', () => {
  const ref = new Date('2026-07-09T15:00:00-03:00')

  it('detecta parte abierto hoy vs vencido', () => {
    const hoy = parteAbierto('t1', '2026-07-09T08:00:00-03:00')
    const vencido = parteAbierto('t2', '2026-07-08T08:00:00-03:00')
    assert.equal(isParteAbiertoHoy(hoy, ref), true)
    assert.equal(isParteAbiertoVencido(hoy, ref), false)
    assert.equal(isParteAbiertoVencido(vencido, ref), true)
  })

  it('filtra tareas pendientes por día', () => {
    const tareas = [baseTarea, { ...baseTarea, id: 't2' }]
    const partes = [
      parteAbierto('t1', '2026-07-09T08:00:00-03:00'),
      parteAbierto('t2', '2026-07-07T08:00:00-03:00'),
    ]
    assert.equal(filterTareasPendientesHoy(tareas, partes, ref).length, 1)
    assert.equal(filterTareasPendientesVencidas(tareas, partes, ref).length, 1)
    assert.equal(filterPartesAbiertosVencidos(partes, ref).length, 1)
    assert.equal(filterTareasConParteAbiertoHoy(tareas, partes, ref)[0].id, 't1')
    assert.equal(filterTareasConParteVencido(tareas, partes, ref)[0].id, 't2')
  })

  it('resolveCerradoEn usa fin del día de apertura para vencidos', () => {
    const vencido = parteAbierto('t1', '2026-07-07T08:00:00-03:00')
    const cerrado = resolveCerradoEn(vencido, ref)
    assert.equal(cerrado.getFullYear(), 2026)
    assert.equal(cerrado.getMonth(), 6)
    assert.equal(cerrado.getDate(), 7)
  })
})
