import type { ParteDeLabores, Tarea, TareaTipo } from '../types'

export function getEjecutorLabelFromTarea(t: Tarea): string {
  if (t.tipo === 'manual') return t.cuadrilla
  const modelo = t.maquinariaModelo?.trim()
  if (modelo) return `${t.persona} · ${t.maquinaria} (${modelo})`
  return `${t.persona} · ${t.maquinaria}`
}

export function getEjecutorLabelFromParte(p: ParteDeLabores): string {
  if (p.tipo === 'manual') {
    const base = (p.cuadrilla ?? 'Sin cuadrilla').trim()
    const resp = p.responsable?.trim()
    return resp ? `${base} · ${resp}` : base
  }
  const persona = (p.persona ?? 'Sin operario').trim()
  const maq = (p.maquinaria ?? '').trim()
  const modelo = p.maquinariaModelo?.trim()
  const resp = p.responsable?.trim()
  const origen = p.origenEjecucion === 'externa' ? 'Externa' : p.origenEjecucion === 'propia' ? 'Propia' : null
  let core = persona
  if (maq && modelo) core = `${persona} · ${maq} (${modelo})`
  else if (maq) core = `${persona} · ${maq}`
  if (origen && resp) return `${origen} · ${resp} · ${core}`
  if (resp) return `${resp} · ${core}`
  if (origen) return `${origen} · ${core}`
  return core
}

export function buildEjecutorPorCuadroPatch(
  cuadroIds: string[],
  label: string,
): Record<string, string> {
  const patch: Record<string, string> = {}
  for (const id of cuadroIds) {
    if (id.trim()) patch[id] = label
  }
  return patch
}

export function mergeEjecutorPorCuadro(
  existing: Record<string, string> | undefined,
  patch: Record<string, string>,
): Record<string, string> {
  return { ...(existing ?? {}), ...patch }
}

export function getEjecutorForCuadro(tarea: Tarea, cuadroId: string): string {
  const mapped = tarea.ejecutorPorCuadro?.[cuadroId]?.trim()
  if (mapped) return mapped
  return getEjecutorLabelFromTarea(tarea)
}

export interface ContinueTaskOptions {
  cantidadPersonas?: number
  cuadrilla?: string
  persona?: string
  maquinaria?: string
  maquinariaModelo?: string
  maquinariaId?: string
  responsable?: string
  origenEjecucion?: 'propia' | 'externa'
}

export function ejecutorLabelFromContinueOptions(
  tipo: TareaTipo,
  opts: ContinueTaskOptions,
): string | undefined {
  if (tipo === 'manual') {
    const cuadrilla = opts.cuadrilla?.trim()
    if (!cuadrilla) return undefined
    const resp = opts.responsable?.trim()
    return resp ? `${cuadrilla} · ${resp}` : cuadrilla
  }
  const persona = opts.persona?.trim()
  const maquinaria = opts.maquinaria?.trim()
  if (!persona || !maquinaria) return undefined
  const modelo = opts.maquinariaModelo?.trim()
  const resp = opts.responsable?.trim()
  const origen = opts.origenEjecucion === 'externa' ? 'Externa' : opts.origenEjecucion === 'propia' ? 'Propia' : null
  let core = modelo ? `${persona} · ${maquinaria} (${modelo})` : `${persona} · ${maquinaria}`
  if (origen && resp) return `${origen} · ${resp} · ${core}`
  if (resp) return `${resp} · ${core}`
  return core
}

/** Etiquetas de ejecutor inferidas de tareas legacy sin ejecutorPorCuadro. */
export function inferEjecutorPorCuadroFromTarea(t: Tarea): Record<string, string> {
  const label = getEjecutorLabelFromTarea(t)
  return buildEjecutorPorCuadroPatch(t.cuadroIds ?? [], label)
}
