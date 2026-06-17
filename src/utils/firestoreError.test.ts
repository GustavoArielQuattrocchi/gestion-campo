import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseFirestoreError } from './firestoreError'

describe('parseFirestoreError', () => {
  it('detecta error de índice y extrae URL', () => {
    const url = 'https://console.firebase.google.com/v1/r/project/test/indexes?create_composite=abc'
    const result = parseFirestoreError(`The query requires an index. You can create it here: ${url}`)
    assert.equal(result.kind, 'index')
    assert.equal(result.indexCreateUrl, url)
  })

  it('error genérico sin URL', () => {
    const result = parseFirestoreError('Permission denied')
    assert.equal(result.kind, 'generic')
    assert.equal(result.indexCreateUrl, null)
  })
})
