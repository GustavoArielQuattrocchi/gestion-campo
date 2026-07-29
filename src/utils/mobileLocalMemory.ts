import type { OrigenEjecucion } from './origenEjecucion'
import { normalizeResponsable } from './origenEjecucion'

const OPERADOR_KEY = 'gestion-campo-operador-recordado'
const SUGERENCIAS_KEY = 'gestion-campo-sugerencias-responsable'
const MAX_SUGERENCIAS = 20

type SugerenciasPorOperador = Record<string, Partial<Record<OrigenEjecucion, string[]>>>

function readSugerencias(): SugerenciasPorOperador {
  try {
    const raw = localStorage.getItem(SUGERENCIAS_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as SugerenciasPorOperador
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

function writeSugerencias(data: SugerenciasPorOperador): void {
  try {
    localStorage.setItem(SUGERENCIAS_KEY, JSON.stringify(data))
  } catch {
    // localStorage puede fallar en modo privado
  }
}

/** Nombre de operador recordado en este dispositivo. */
export function loadRememberedOperador(): string | null {
  try {
    const raw = localStorage.getItem(OPERADOR_KEY)
    const nombre = typeof raw === 'string' ? raw.trim() : ''
    return nombre || null
  } catch {
    return null
  }
}

export function saveRememberedOperador(nombre: string): void {
  try {
    const trimmed = nombre.trim()
    if (!trimmed) return
    localStorage.setItem(OPERADOR_KEY, trimmed)
  } catch {
    // ignorar
  }
}

export function clearRememberedOperador(): void {
  try {
    localStorage.removeItem(OPERADOR_KEY)
  } catch {
    // ignorar
  }
}

/** Sugerencias de Responsable/Empresa para este operador en el dispositivo. */
export function loadSugerenciasResponsable(
  operador: string,
  origen: OrigenEjecucion,
): string[] {
  const key = operador.trim().toLowerCase()
  if (!key) return []
  const list = readSugerencias()[key]?.[origen] ?? []
  return list.filter(s => typeof s === 'string' && s.trim())
}

export function rememberSugerenciaResponsable(
  operador: string,
  origen: OrigenEjecucion,
  valor: string,
): void {
  const opKey = operador.trim().toLowerCase()
  const normalized = normalizeResponsable(valor)
  if (!opKey || !normalized) return

  const all = readSugerencias()
  const prev = all[opKey]?.[origen] ?? []
  const next = [normalized, ...prev.filter(s => s.toLowerCase() !== normalized.toLowerCase())].slice(
    0,
    MAX_SUGERENCIAS,
  )
  all[opKey] = { ...all[opKey], [origen]: next }
  writeSugerencias(all)
}
