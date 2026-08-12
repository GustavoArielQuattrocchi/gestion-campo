import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DASHBOARD_LOOKBACK_DAYS,
  dashboardLookbackDate,
  tareasQueryModes,
} from './firestoreDashboardQueryConfig.ts'

describe('firestoreDashboardQueryConfig', () => {
  it('define ventana de lookback', () => {
    assert.equal(DASHBOARD_LOOKBACK_DAYS, 365)
    const now = new Date('2026-08-12T15:30:00')
    const start = dashboardLookbackDate(now)
    const diffDays = Math.round((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    assert.ok(diffDays >= 364 && diffDays <= 366, `diffDays=${diffDays}`)
  })

  it('elige listeners según filtro de estado', () => {
    assert.deepEqual(tareasQueryModes('todos'), { enProgreso: true, historico: true })
    assert.deepEqual(tareasQueryModes('en_progreso'), { enProgreso: true, historico: false })
    assert.deepEqual(tareasQueryModes('finalizada'), { enProgreso: false, historico: true })
  })
})
