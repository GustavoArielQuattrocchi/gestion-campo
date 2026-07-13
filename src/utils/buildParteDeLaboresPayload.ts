import type { Timestamp } from 'firebase/firestore'
import type { ParteDeLabores, RendimientoUnidad, Tarea, WeatherSnapshot } from '../types'

export type ParteDeLaboresFirestorePayload = Omit<ParteDeLabores, 'id'>

type ParteExtras = {
  horaInicio?: string
  horaFin?: string
  observaciones?: string
  rendimientoPorCuadro?: Record<string, number>
  clima?: WeatherSnapshot
}

/** Datos de ejecutor al abrir parte (p. ej. otra cuadrilla en la misma labor). */
export type ParteEjecutorOverride = {
  cuadrilla?: string
  cantidadPersonas?: number
  persona?: string
  maquinaria?: string
  maquinariaModelo?: string
  maquinariaId?: string
}

function parteBaseFields(tarea: Tarea, operador: string) {
  return {
    tareaId: tarea.id,
    fincaId: tarea.fincaId,
    fincaNombre: tarea.fincaNombre,
    tarea: tarea.tarea,
    tipo: tarea.tipo,
    operador: operador.trim(),
    cuadros: tarea.cuadros ?? [],
    ...(tarea.cuadroIds?.length ? { cuadroIds: tarea.cuadroIds } : {}),
  }
}

/** Apertura de jornada: parte abierto sin rendimiento (al cargar tarea en campo). */
export function buildParteAbiertoPayload(
  tarea: Tarea,
  operador: string,
  abiertoEn: Timestamp,
  ejecutor?: ParteEjecutorOverride,
): ParteDeLaboresFirestorePayload {
  const base = {
    ...parteBaseFields(tarea, operador),
    estado: 'abierto' as const,
    abiertoEn,
  }

  if (tarea.tipo === 'manual') {
    return {
      ...base,
      cuadrilla: ejecutor?.cuadrilla?.trim() || tarea.cuadrilla,
      cantidadPersonas: ejecutor?.cantidadPersonas ?? tarea.cantidadPersonas,
    }
  }

  return {
    ...base,
    persona: ejecutor?.persona?.trim() || tarea.persona,
    maquinaria: ejecutor?.maquinaria?.trim() || tarea.maquinaria,
    ...((ejecutor?.maquinariaModelo ?? tarea.maquinariaModelo)
      ? { maquinariaModelo: ejecutor?.maquinariaModelo ?? tarea.maquinariaModelo }
      : {}),
    ...((ejecutor?.maquinariaId ?? tarea.maquinariaId)
      ? { maquinariaId: ejecutor?.maquinariaId ?? tarea.maquinariaId }
      : {}),
  }
}

/** Cierre de jornada: actualización del parte abierto con rendimiento. */
export function buildParteCierreUpdate(
  rendimiento: string,
  cerradoEn: Timestamp,
  rendimientoCantidad?: number,
  rendimientoUnidad?: RendimientoUnidad,
  extras: ParteExtras = {},
): Record<string, unknown> {
  return {
    estado: 'cerrado',
    cerradoEn,
    rendimiento: rendimiento.trim(),
    ...(typeof rendimientoCantidad === 'number' ? { rendimientoCantidad } : {}),
    ...(rendimientoUnidad ? { rendimientoUnidad } : {}),
    ...(extras.horaInicio ? { horaInicio: extras.horaInicio } : {}),
    ...(extras.horaFin ? { horaFin: extras.horaFin } : {}),
    ...(extras.observaciones ? { observaciones: extras.observaciones } : {}),
    ...(extras.clima ? { clima: extras.clima } : {}),
  }
}

/** Documento cerrado completo (legacy / tests). */
export function buildParteDeLaboresPayload(
  tarea: Tarea,
  rendimiento: string,
  operador: string,
  cerradoEn: Timestamp,
  rendimientoCantidad?: number,
  rendimientoUnidad?: RendimientoUnidad,
  _finalizoTarea?: boolean,
  extras: ParteExtras = {},
): ParteDeLaboresFirestorePayload {
  const abierto = buildParteAbiertoPayload(tarea, operador, cerradoEn)
  return {
    ...abierto,
    estado: 'cerrado',
    abiertoEn: cerradoEn,
    cerradoEn,
    rendimiento: rendimiento.trim(),
    ...(typeof rendimientoCantidad === 'number' ? { rendimientoCantidad } : {}),
    ...(rendimientoUnidad ? { rendimientoUnidad } : {}),
    ...(extras.horaInicio ? { horaInicio: extras.horaInicio } : {}),
    ...(extras.horaFin ? { horaFin: extras.horaFin } : {}),
    ...(extras.observaciones ? { observaciones: extras.observaciones } : {}),
    ...(extras.rendimientoPorCuadro && Object.keys(extras.rendimientoPorCuadro).length > 0
      ? { rendimientoPorCuadro: extras.rendimientoPorCuadro }
      : {}),
    ...(extras.clima ? { clima: extras.clima } : {}),
  }
}
