import type { Timestamp } from 'firebase/firestore'
import type { ParteDeLabores, RendimientoUnidad, Tarea } from '../types'

export type ParteDeLaboresFirestorePayload = Omit<ParteDeLabores, 'id'>

export function buildParteDeLaboresPayload(
  tarea: Tarea,
  rendimiento: string,
  operador: string,
  cerradoEn: Timestamp,
  rendimientoCantidad?: number,
  rendimientoUnidad?: RendimientoUnidad,
): ParteDeLaboresFirestorePayload {
  const base = {
    tareaId: tarea.id,
    fincaId: tarea.fincaId,
    fincaNombre: tarea.fincaNombre,
    tarea: tarea.tarea,
    tipo: tarea.tipo,
    operador: operador.trim(),
    rendimiento: rendimiento.trim(),
    ...(typeof rendimientoCantidad === 'number' ? { rendimientoCantidad } : {}),
    ...(rendimientoUnidad ? { rendimientoUnidad } : {}),
    cuadros: tarea.cuadros ?? [],
    ...(tarea.cuadroIds?.length ? { cuadroIds: tarea.cuadroIds } : {}),
    cerradoEn,
  }

  if (tarea.tipo === 'manual') {
    return {
      ...base,
      cuadrilla: tarea.cuadrilla,
      cantidadPersonas: tarea.cantidadPersonas,
    }
  }

  return {
    ...base,
    persona: tarea.persona,
    maquinaria: tarea.maquinaria,
    ...(tarea.maquinariaModelo ? { maquinariaModelo: tarea.maquinariaModelo } : {}),
    ...(tarea.maquinariaId ? { maquinariaId: tarea.maquinariaId } : {}),
  }
}
