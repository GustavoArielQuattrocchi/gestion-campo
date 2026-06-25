import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseTarea, parseTareasFromSnapshot } from './parseTarea'

function mockTs(date: string) {
  return { toDate: () => new Date(date) }
}

const baseManual = {
  fincaId: 'foa',
  fincaNombre: 'Finca Ocho A',
  tarea: 'Poda',
  estado: 'en_progreso',
  tipo: 'manual',
  operador: 'Juan',
  fechaInicio: mockTs('2024-06-01T10:00:00'),
  cuadros: ['Cuartel 5'],
  cuadrilla: 'Cuadrilla 1',
  cantidadPersonas: 8,
}

describe('parseTarea', () => {
  it('parsea tarea manual válida', () => {
    const result = parseTarea('abc', baseManual)
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.tarea.tipo, 'manual')
    if (result.tarea.tipo === 'manual') {
      assert.equal(result.tarea.cantidadPersonas, 8)
    }
    assert.deepEqual(result.tarea.cuadros, ['Cuartel 5'])
  })

  it('incluye cuadroIds cuando están presentes', () => {
    const result = parseTarea('abc', { ...baseManual, cuadroIds: ['FOA-5', 'FOA-6'] })
    assert.equal(result.success, true)
    if (!result.success) return
    assert.deepEqual(result.tarea.cuadroIds, ['FOA-5', 'FOA-6'])
  })

  it('usa fincaNombre como fincaId en documentos legacy', () => {
    const result = parseTarea('abc', { ...baseManual, fincaId: '' })
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.tarea.fincaId, 'Finca Ocho A')
    assert.equal(result.tarea.fincaNombre, 'Finca Ocho A')
  })

  it('rechaza sin fincaId ni fincaNombre', () => {
    const result = parseTarea('abc', { ...baseManual, fincaId: '', fincaNombre: '' })
    assert.deepEqual(result, { success: false, reason: 'falta fincaId' })
  })

  it('rechaza cantidadPersonas inválida', () => {
    const result = parseTarea('abc', { ...baseManual, cantidadPersonas: 0 })
    assert.equal(result.success, false)
    if (result.success) return
    assert.match(result.reason, /^cantidadPersonas inválida/)
  })

  it('rechaza fechaInicio inválida', () => {
    const result = parseTarea('abc', { ...baseManual, fechaInicio: '2024-01-01' })
    assert.deepEqual(result, { success: false, reason: 'fechaInicio inválida' })
  })

  it('parsea tarea mecánica válida', () => {
    const result = parseTarea('xyz', {
      ...baseManual,
      tipo: 'mecanica',
      persona: 'Pedro',
      maquinaria: 'Tractor',
      cuadrilla: undefined,
      cantidadPersonas: undefined,
    })
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.tarea.tipo, 'mecanica')
    if (result.tarea.tipo === 'mecanica') {
      assert.equal(result.tarea.persona, 'Pedro')
      assert.equal(result.tarea.maquinaria, 'Tractor')
    }
  })
})

describe('parseTareasFromSnapshot', () => {
  it('separa válidas e inválidas', () => {
    const docs = [
      { id: 'ok', data: () => baseManual as Record<string, unknown> },
      { id: 'bad', data: () => ({ ...baseManual, estado: 'cancelada' }) as Record<string, unknown> },
    ]
    const { tareas, invalid } = parseTareasFromSnapshot(docs)
    assert.equal(tareas.length, 1)
    assert.equal(tareas[0].id, 'ok')
    assert.deepEqual(invalid, [{ id: 'bad', reason: 'estado inválido' }])
  })
})
