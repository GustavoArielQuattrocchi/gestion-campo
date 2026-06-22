import type { Tarea } from '../types'

/** Etiqueta de tarea para listas del mapa del escritorio. */
export function formatTareaMapLabel(t: Tarea): string {
  if (t.tipo === 'manual') {
    return `${t.tarea} · ${t.cuadrilla}`
  }
  const modelo = t.maquinariaModelo?.trim()
  if (modelo) {
    return `${t.tarea} · ${t.maquinaria} (${modelo})`
  }
  return `${t.tarea} · ${t.persona} · ${t.maquinaria}`
}
