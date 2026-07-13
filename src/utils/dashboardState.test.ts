import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildActiveTasksWarning,
  buildFilterSearchParams,
  buildInvalidDocsWarning,
  buildMetricsNote,
  hasMoreTareas,
  nextVisibleCount,
  paginateTareas,
  readFilterParam,
} from './dashboardState'

describe('readFilterParam', () => {
  it('devuelve fallback si falta o es inválido', () => {
    const allowed = new Set(['todas', 'FOA'])
    assert.equal(readFilterParam(new URLSearchParams(), 'finca', 'todas', allowed), 'todas')
    assert.equal(readFilterParam(new URLSearchParams('finca=XXX'), 'finca', 'todas', allowed), 'todas')
  })

  it('devuelve valor permitido de la URL', () => {
    const allowed = new Set(['manual', 'mecanica'])
    assert.equal(readFilterParam(new URLSearchParams('tipo=manual'), 'tipo', 'todos', allowed), 'manual')
  })
})

describe('buildFilterSearchParams', () => {
  it('omite valores por defecto', () => {
    assert.equal(buildFilterSearchParams('todas', 'todos', 'todos').toString(), '')
  })

  it('incluye filtros activos', () => {
    const params = buildFilterSearchParams('Finca A', 'manual', 'en_progreso')
    assert.equal(params.get('finca'), 'Finca A')
    assert.equal(params.get('tipo'), 'manual')
    assert.equal(params.get('estado'), 'en_progreso')
  })

  it('incluye filtro de labor del mapa', () => {
    const params = buildFilterSearchParams('todas', 'todos', 'todos', 'Poda')
    assert.equal(params.get('tarea'), 'Poda')
    assert.equal(params.get('finca'), null)
  })
})

describe('paginación dashboard', () => {
  const items = [1, 2, 3, 4, 5]

  it('paginateTareas limita filas visibles', () => {
    assert.deepEqual(paginateTareas(items, 2), [1, 2])
  })

  it('hasMoreTareas detecta más páginas', () => {
    assert.equal(hasMoreTareas(5, 2), true)
    assert.equal(hasMoreTareas(5, 5), false)
  })

  it('nextVisibleCount avanza sin pasar el total', () => {
    assert.equal(nextVisibleCount(2, 5, 2), 4)
    assert.equal(nextVisibleCount(4, 5, 2), 5)
  })
})

describe('mensajes de UI', () => {
  it('buildMetricsNote solo si hay más filas', () => {
    assert.equal(buildMetricsNote(100, 250, true)?.includes('250'), true)
    assert.equal(buildMetricsNote(10, 10, false), null)
  })

  it('buildInvalidDocsWarning pluraliza', () => {
    assert.match(buildInvalidDocsWarning(1)!, /1 registro/)
    assert.match(buildInvalidDocsWarning(3)!, /3 registros/)
  })

  it('buildActiveTasksWarning pluraliza', () => {
    assert.match(buildActiveTasksWarning(2)!, /2 tareas activas/)
  })
})
