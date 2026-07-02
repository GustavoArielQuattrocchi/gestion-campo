import type { RendimientoDiario, RendimientoUnidad } from '../types'

export interface RendimientoMatch {
  parteId: string
  /** Datos originales del parte para emparejar registros sin parteId (legacy). */
  operador: string
  texto: string
}

function matchesEntry(entry: RendimientoDiario, match: RendimientoMatch): boolean {
  if (entry.parteId) return entry.parteId === match.parteId
  return entry.operador === match.operador && entry.texto === match.texto
}

/** Texto de rendimiento "actual" de la tarea: el del último registro. */
export function lastRendimientoTexto(entries: RendimientoDiario[]): string {
  if (entries.length === 0) return ''
  return entries[entries.length - 1].texto ?? ''
}

/**
 * Aplica la edición de un parte al historial de la tarea. Actualiza el primer
 * registro que coincida (por parteId o, en documentos legacy, por operador+texto).
 */
export function applyRendimientoEdit(
  entries: RendimientoDiario[],
  match: RendimientoMatch,
  cantidad: number,
  unidad: RendimientoUnidad,
  texto: string,
): { entries: RendimientoDiario[]; rendimiento: string; changed: boolean } {
  let changed = false
  const next = entries.map(entry => {
    if (!changed && matchesEntry(entry, match)) {
      changed = true
      return { ...entry, texto, cantidad, unidad }
    }
    return entry
  })
  return { entries: next, rendimiento: lastRendimientoTexto(next), changed }
}

/** Elimina del historial de la tarea el registro vinculado a un parte. */
export function removeRendimientoEntry(
  entries: RendimientoDiario[],
  match: RendimientoMatch,
): { entries: RendimientoDiario[]; rendimiento: string; changed: boolean } {
  let removed = false
  const next = entries.filter(entry => {
    if (!removed && matchesEntry(entry, match)) {
      removed = true
      return false
    }
    return true
  })
  return { entries: next, rendimiento: lastRendimientoTexto(next), changed: removed }
}
