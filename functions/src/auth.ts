import { getAuth } from 'firebase-admin/auth'

const ADMIN_DOMAIN = '@salentein.com'

export type AdminCheck =
  | { ok: true; uid: string }
  | { ok: false; status: number; error: string }

/**
 * Misma política que esAdmin() del escritorio: email verificado,
 * dominio salentein.com y proveedor contraseña.
 */
export async function verifyAdmin(authorization: string | undefined): Promise<AdminCheck> {
  if (!authorization?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Tenés que iniciar sesión para usar el asesor.' }
  }
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) {
    return { ok: false, status: 401, error: 'Tenés que iniciar sesión para usar el asesor.' }
  }

  try {
    const decoded = await getAuth().verifyIdToken(token)
    const email = decoded.email?.trim().toLowerCase() ?? ''
    const provider = decoded.firebase?.sign_in_provider
    const isAdmin = decoded.email_verified === true
      && provider === 'password'
      && email.endsWith(ADMIN_DOMAIN)
    if (!isAdmin) {
      return { ok: false, status: 403, error: 'Solo un administrador de Salentein puede usar el asesor.' }
    }
    return { ok: true, uid: decoded.uid }
  } catch {
    return { ok: false, status: 401, error: 'La sesión no es válida. Volvé a iniciar sesión.' }
  }
}
