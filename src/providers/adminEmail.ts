/** Dominio de correo autorizado para administradores del escritorio. */
export const ADMIN_EMAIL_DOMAIN = 'salentein.com'

export const ADMIN_EMAIL_DOMAIN_ERROR = `Solo se permiten cuentas @${ADMIN_EMAIL_DOMAIN}.`

export function isAdminEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

/** Normaliza el correo y rechaza dominios no autorizados, sin llamar a Firebase. */
export function requireAdminEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  if (!isAdminEmail(normalized)) {
    throw new Error(ADMIN_EMAIL_DOMAIN_ERROR)
  }
  return normalized
}
