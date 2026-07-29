import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  labelResponsableCampo,
  origenFromCuadrilla,
  normalizeResponsable,
} from './origenEjecucion.ts'
import { parteEjecutorKey, ejecutorKeyFromTareaOrOverride } from './parteEstado.ts'
import type { TareaManual } from '../types.ts'

describe('origenEjecucion', () => {
  it('detecta externa desde nombre de cuadrilla', () => {
    assert.equal(origenFromCuadrilla('Cuadrilla Externa'), 'externa')
    assert.equal(origenFromCuadrilla('Cuadrilla Propia'), 'propia')
    assert.equal(labelResponsableCampo('externa'), 'Empresa')
    assert.equal(labelResponsableCampo('propia'), 'Responsable')
    assert.equal(normalizeResponsable('  Foo   Bar  '), 'Foo Bar')
  })
})

describe('parteEjecutorKey con responsable', () => {
  const tarea = {
    id: 't1',
    fincaId: 'FOA',
    fincaNombre: 'FOA',
    tarea: 'Podando',
    cuadros: [],
    estado: 'en_progreso',
    operador: 'op',
    fechaInicio: { toDate: () => new Date() },
    tipo: 'manual',
    cuadrilla: 'Cuadrilla Propia',
    cantidadPersonas: 4,
  } as TareaManual

  it('distingue misma cuadrilla con distinto responsable', () => {
    const a = parteEjecutorKey({
      tipo: 'manual',
      cuadrilla: 'Cuadrilla Externa',
      responsable: 'Empresa A',
    })
    const b = parteEjecutorKey({
      tipo: 'manual',
      cuadrilla: 'Cuadrilla Externa',
      responsable: 'Empresa B',
    })
    assert.notEqual(a, b)
    const keyA = ejecutorKeyFromTareaOrOverride(tarea, {
      cuadrilla: 'Cuadrilla Externa',
      responsable: 'Empresa A',
    })
    assert.equal(keyA, a)
  })
})
