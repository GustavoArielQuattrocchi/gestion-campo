const STORAGE_KEY = 'gestion-campo-mobile'

export interface MobileSession {
  operadorNombre: string
  fincaId: string
  fincaNombre: string
}

export function loadMobileSession(): MobileSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<MobileSession>
    if (
      typeof data.operadorNombre === 'string' &&
      data.operadorNombre.trim() &&
      typeof data.fincaId === 'string' &&
      data.fincaId.trim() &&
      typeof data.fincaNombre === 'string' &&
      data.fincaNombre.trim()
    ) {
      return {
        operadorNombre: data.operadorNombre.trim(),
        fincaId: data.fincaId.trim(),
        fincaNombre: data.fincaNombre.trim(),
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveMobileSession(session: MobileSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage puede fallar en modo privado estricto
  }
}

export function clearMobileSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorar
  }
}
