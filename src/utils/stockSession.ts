import { isPuntoStock, type PuntoStock } from '../modules/stock/constants'

const STORAGE_KEY = 'gestion-campo-stock'

export interface StockSession {
  operadorNombre: string
  punto: PuntoStock
}

export function loadStockSession(): StockSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<StockSession>
    if (
      typeof data.operadorNombre === 'string' &&
      data.operadorNombre.trim() &&
      isPuntoStock(data.punto)
    ) {
      return { operadorNombre: data.operadorNombre.trim(), punto: data.punto }
    }
    return null
  } catch {
    return null
  }
}

export function saveStockSession(session: StockSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage puede fallar en modo privado
  }
}

export function clearStockSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorar
  }
}

export function hasStockSession(operadorNombre: string, punto: string): boolean {
  return operadorNombre.trim().length > 0 && isPuntoStock(punto)
}
