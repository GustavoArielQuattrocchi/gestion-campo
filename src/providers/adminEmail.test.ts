import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ADMIN_EMAIL_DOMAIN,
  ADMIN_EMAIL_DOMAIN_ERROR,
  isAdminEmail,
  requireAdminEmail,
} from './adminEmail.ts'

describe('isAdminEmail', () => {
  it('acepta el dominio autorizado ignorando espacios y mayúsculas', () => {
    assert.equal(isAdminEmail(`  Ana@${ADMIN_EMAIL_DOMAIN.toUpperCase()}  `), true)
  })

  it('rechaza otros dominios y valores vacíos', () => {
    assert.equal(isAdminEmail('persona@gmail.com'), false)
    assert.equal(isAdminEmail(''), false)
    assert.equal(isAdminEmail(null), false)
    assert.equal(isAdminEmail(undefined), false)
  })
})

describe('requireAdminEmail', () => {
  it('normaliza un correo del dominio autorizado', () => {
    assert.equal(requireAdminEmail(`  Ana@${ADMIN_EMAIL_DOMAIN.toUpperCase()}  `), `ana@${ADMIN_EMAIL_DOMAIN}`)
  })

  it('rechaza otro dominio antes de cualquier llamada externa', () => {
    assert.throws(
      () => requireAdminEmail('persona@gmail.com'),
      (err: unknown) => err instanceof Error && err.message === ADMIN_EMAIL_DOMAIN_ERROR,
    )
  })
})
