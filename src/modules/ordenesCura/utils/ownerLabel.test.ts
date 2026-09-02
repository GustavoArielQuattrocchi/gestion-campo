import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatOwnerLabel } from './ownerLabel.ts'

describe('formatOwnerLabel', () => {
  it('muestra la parte local del email', () => {
    assert.equal(formatOwnerLabel('quattrocchi@salentein.com'), 'quattrocchi')
  })

  it('devuelve raya si no hay email', () => {
    assert.equal(formatOwnerLabel(''), '—')
    assert.equal(formatOwnerLabel(undefined), '—')
  })
})
