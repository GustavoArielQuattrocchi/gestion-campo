import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { RendimientoDiario } from '../types.ts'
import {
  applyRendimientoEdit,
  lastRendimientoTexto,
  removeRendimientoEntry,
  resolveParteDeletion,
  type RendimientoMatch,
} from './partesLaboresSync.ts'

const ts = (iso: string) =>
  ({ toDate: () => new Date(iso) }) as import('firebase/firestore').Timestamp

const entries: RendimientoDiario[] = [
  { fecha: ts('2026-06-24T12:00:00Z'), texto: '5 hileras', operador: 'Juan', cantidad: 5, unidad: 'hileras', parteId: 'p1' },
  { fecha: ts('2026-06-25T12:00:00Z'), texto: '8 hileras', operador: 'Juan', cantidad: 8, unidad: 'hileras', parteId: 'p2' },
]

describe('partesLaboresSync', () => {
  it('lastRendimientoTexto devuelve el último registro', () => {
    assert.equal(lastRendimientoTexto(entries), '8 hileras')
    assert.equal(lastRendimientoTexto([]), '')
  })

  it('applyRendimientoEdit actualiza el registro por parteId', () => {
    const match: RendimientoMatch = { parteId: 'p1', operador: 'Juan', texto: '5 hileras' }
    const result = applyRendimientoEdit(entries, match, 10, 'jornal', '10 jornal')
    assert.equal(result.changed, true)
    assert.equal(result.entries[0].texto, '10 jornal')
    assert.equal(result.entries[0].cantidad, 10)
    assert.equal(result.entries[0].unidad, 'jornal')
    assert.equal(result.entries[1].texto, '8 hileras')
    assert.equal(result.rendimiento, '8 hileras')
  })

  it('applyRendimientoEdit recalcula rendimiento si edita el último', () => {
    const match: RendimientoMatch = { parteId: 'p2', operador: 'Juan', texto: '8 hileras' }
    const result = applyRendimientoEdit(entries, match, 3, 'claros', '3 claros')
    assert.equal(result.rendimiento, '3 claros')
  })

  it('applyRendimientoEdit usa fallback operador+texto en legacy', () => {
    const legacy: RendimientoDiario[] = [
      { fecha: ts('2026-06-24T12:00:00Z'), texto: '5 hileras', operador: 'Juan' },
    ]
    const match: RendimientoMatch = { parteId: 'px', operador: 'Juan', texto: '5 hileras' }
    const result = applyRendimientoEdit(legacy, match, 2, 'plantas', '2 plantas')
    assert.equal(result.changed, true)
    assert.equal(result.entries[0].texto, '2 plantas')
  })

  it('applyRendimientoEdit no cambia nada si no hay match', () => {
    const match: RendimientoMatch = { parteId: 'zzz', operador: 'Otro', texto: 'x' }
    const result = applyRendimientoEdit(entries, match, 1, 'jornal', '1 jornal')
    assert.equal(result.changed, false)
  })

  it('removeRendimientoEntry elimina el registro y recalcula', () => {
    const match: RendimientoMatch = { parteId: 'p2', operador: 'Juan', texto: '8 hileras' }
    const result = removeRendimientoEntry(entries, match)
    assert.equal(result.changed, true)
    assert.equal(result.entries.length, 1)
    assert.equal(result.rendimiento, '5 hileras')
  })

  it('removeRendimientoEntry deja rendimiento vacío si no quedan registros', () => {
    const one: RendimientoDiario[] = [entries[0]]
    const match: RendimientoMatch = { parteId: 'p1', operador: 'Juan', texto: '5 hileras' }
    const result = removeRendimientoEntry(one, match)
    assert.equal(result.entries.length, 0)
    assert.equal(result.rendimiento, '')
  })
})

describe('resolveParteDeletion', () => {
  it('reabre la tarea si el parte la finalizó', () => {
    const match: RendimientoMatch = { parteId: 'p2', operador: 'Juan', texto: '8 hileras' }
    const result = resolveParteDeletion(entries, match, { finalizada: true, finalizoTarea: true })
    assert.equal(result.changed, true)
    assert.equal(result.reopen, true)
    assert.equal(result.entries.length, 1)
  })

  it('reabre la tarea si era el último registro', () => {
    const one: RendimientoDiario[] = [entries[0]]
    const match: RendimientoMatch = { parteId: 'p1', operador: 'Juan', texto: '5 hileras' }
    const result = resolveParteDeletion(one, match, { finalizada: true })
    assert.equal(result.reopen, true)
    assert.equal(result.entries.length, 0)
  })

  it('no reabre en multi-día si el parte no finalizó y quedan registros', () => {
    const match: RendimientoMatch = { parteId: 'p1', operador: 'Juan', texto: '5 hileras' }
    const result = resolveParteDeletion(entries, match, { finalizada: true })
    assert.equal(result.changed, true)
    assert.equal(result.reopen, false)
    assert.equal(result.entries.length, 1)
  })

  it('no reabre si la tarea no estaba finalizada', () => {
    const match: RendimientoMatch = { parteId: 'p2', operador: 'Juan', texto: '8 hileras' }
    const result = resolveParteDeletion(entries, match, { finalizada: false, finalizoTarea: true })
    assert.equal(result.reopen, false)
  })
})
