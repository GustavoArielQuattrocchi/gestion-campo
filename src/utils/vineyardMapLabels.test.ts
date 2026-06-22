import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatTareaMapLabel } from './vineyardMapLabels'
import type { TareaMecanica } from '../types'

const baseMecanica = {
  id: '1',
  fincaId: 'FOA',
  fincaNombre: 'Finca Ocho A',
  tarea: 'Desmalezado',
  cuadros: ['Cuartel 5'],
  estado: 'en_progreso' as const,
  operador: 'Juan',
  fechaInicio: { toDate: () => new Date() } as import('firebase/firestore').Timestamp,
  tipo: 'mecanica' as const,
  persona: 'Pedro',
  maquinaria: 'MT27',
}

describe('formatTareaMapLabel', () => {
  it('muestra modelo del tractor en tareas mecánicas', () => {
    const t: TareaMecanica = {
      ...baseMecanica,
      maquinariaModelo: 'NEW HOLLAND TT-65-D',
    }
    assert.equal(formatTareaMapLabel(t), 'Desmalezado · MT27 (NEW HOLLAND TT-65-D)')
  })

  it('usa persona si no hay modelo (legacy)', () => {
    const t: TareaMecanica = { ...baseMecanica }
    assert.equal(formatTareaMapLabel(t), 'Desmalezado · Pedro · MT27')
  })
})
