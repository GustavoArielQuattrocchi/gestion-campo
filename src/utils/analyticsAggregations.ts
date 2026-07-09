import { format } from 'date-fns'
import type { Tarea, TareaManual, ParteDeLabores, RendimientoUnidad } from '../types'
import { getHectareasCuadro, getTotalHectareasFinca } from '../data/fincaData'

/** Daily productivity data point for bar chart */
export interface DailyProductivity {
  fecha: string
  label: string
  entries: { tarea: string; cantidad: number; unidad: RendimientoUnidad }[]
  totalByUnit: Record<string, number>
}

/** Daily staffing data point */
export interface DailyStaffing {
  fecha: string
  label: string
  personas: number
  tareas: number
  fincas: string[]
}

/** Cumulative progress data point */
export interface ProgressPoint {
  fecha: string
  label: string
  hectareasAcumuladas: number
  cuadrosAcumulados: number
}

/** KPI summary */
export interface AnalyticsKPIs {
  rendimientoPromedioPorLabor: { tarea: string; promedio: number; unidad: string; count: number }[]
  diasParaCompletar: { tarea: string; diasPromedio: number; count: number }[]
  operadoresActivos: number
  partesPorDia: number
  rendimientoPorPersona: { tarea: string; valor: number; unidad: string }[]
  utilizacionMaquinaria: { maquinaria: string; modelo?: string; partes: number }[]
  avancePorFinca: { finca: string; hectareasFinalizadas: number; hectareasTotales: number; porcentaje: number }[]
}

function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function toLabel(d: Date): string {
  return format(d, 'dd/MM')
}

export function computeDailyProductivity(tareas: Tarea[]): DailyProductivity[] {
  const byDate = new Map<string, { date: Date; entries: { tarea: string; cantidad: number; unidad: RendimientoUnidad }[] }>()

  for (const t of tareas) {
    if (!t.rendimientosDiarios) continue
    for (const rd of t.rendimientosDiarios) {
      if (rd.cantidad == null || !rd.unidad) continue
      const d = rd.fecha.toDate()
      const key = toDateKey(d)
      let bucket = byDate.get(key)
      if (!bucket) {
        bucket = { date: d, entries: [] }
        byDate.set(key, bucket)
      }
      bucket.entries.push({ tarea: t.tarea, cantidad: rd.cantidad, unidad: rd.unidad })
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, { date, entries }]) => {
      const totalByUnit: Record<string, number> = {}
      for (const e of entries) {
        totalByUnit[e.unidad] = (totalByUnit[e.unidad] ?? 0) + e.cantidad
      }
      return { fecha, label: toLabel(date), entries, totalByUnit }
    })
}

export function computeDailyStaffing(tareas: Tarea[]): DailyStaffing[] {
  const manualTareas = tareas.filter((t): t is TareaManual => t.tipo === 'manual')
  const byDate = new Map<string, { date: Date; personas: number; tareas: number; fincas: Set<string> }>()

  for (const t of manualTareas) {
    const addDay = (d: Date) => {
      const key = toDateKey(d)
      let bucket = byDate.get(key)
      if (!bucket) {
        bucket = { date: d, personas: 0, tareas: 0, fincas: new Set() }
        byDate.set(key, bucket)
      }
      bucket.personas += t.cantidadPersonas
      bucket.tareas += 1
      bucket.fincas.add(t.fincaNombre)
    }

    if (t.rendimientosDiarios && t.rendimientosDiarios.length > 0) {
      const daysSeen = new Set<string>()
      for (const rd of t.rendimientosDiarios) {
        if (!rd.fecha?.toDate) continue
        const d = rd.fecha.toDate()
        const key = toDateKey(d)
        if (daysSeen.has(key)) continue
        daysSeen.add(key)
        addDay(d)
      }
    } else if (t.fechaInicio?.toDate) {
      addDay(t.fechaInicio.toDate())
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, { date, personas, tareas: count, fincas }]) => ({
      fecha,
      label: toLabel(date),
      personas,
      tareas: count,
      fincas: Array.from(fincas),
    }))
}

export function computeCumulativeProgress(tareas: Tarea[]): ProgressPoint[] {
  const dateHaMap = new Map<string, { date: Date; ha: number; cuadros: number }>()

  for (const t of tareas) {
    const finalized = t.cuadroIdsFinalizados ?? []
    if (finalized.length === 0) continue

    const dates: { key: string; date: Date }[] = []
    if (t.rendimientosDiarios && t.rendimientosDiarios.length > 0) {
      for (const rd of t.rendimientosDiarios) {
        const d = rd.fecha.toDate()
        dates.push({ key: toDateKey(d), date: d })
      }
    }

    if (dates.length === 0) {
      const d = t.fechaInicio.toDate()
      dates.push({ key: toDateKey(d), date: d })
    }

    const uniqueDates = [...new Map(dates.map(d => [d.key, d])).values()]
    uniqueDates.sort((a, b) => a.key.localeCompare(b.key))

    const cuadrosPerDate = Math.max(1, Math.floor(finalized.length / uniqueDates.length))
    let assigned = 0

    for (let i = 0; i < uniqueDates.length; i++) {
      const { key, date } = uniqueDates[i]
      const isLast = i === uniqueDates.length - 1
      const count = isLast ? finalized.length - assigned : cuadrosPerDate
      const cuadrosSlice = finalized.slice(assigned, assigned + count)
      assigned += count

      let bucket = dateHaMap.get(key)
      if (!bucket) {
        bucket = { date, ha: 0, cuadros: 0 }
        dateHaMap.set(key, bucket)
      }

      for (const cuadroId of cuadrosSlice) {
        bucket.ha += getHectareasCuadro(t.fincaId, cuadroId)
        bucket.cuadros += 1
      }
    }
  }

  const sorted = Array.from(dateHaMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  let haAcum = 0
  let cuadrosAcum = 0

  return sorted.map(([fecha, { date, ha, cuadros }]) => {
    haAcum += ha
    cuadrosAcum += cuadros
    return {
      fecha,
      label: toLabel(date),
      hectareasAcumuladas: Math.round(haAcum * 100) / 100,
      cuadrosAcumulados: cuadrosAcum,
    }
  })
}

export function computeAnalyticsKPIs(tareas: Tarea[], partes: ParteDeLabores[]): AnalyticsKPIs {
  // --- rendimientoPromedioPorLabor ---
  const rendByLabor = new Map<string, { sum: number; count: number; unidad: string }>()
  for (const p of partes) {
    if (p.rendimientoCantidad == null || !p.rendimientoUnidad) continue
    const key = `${p.tarea}|${p.rendimientoUnidad}`
    const entry = rendByLabor.get(key) ?? { sum: 0, count: 0, unidad: p.rendimientoUnidad }
    entry.sum += p.rendimientoCantidad
    entry.count += 1
    rendByLabor.set(key, entry)
  }
  const rendimientoPromedioPorLabor = Array.from(rendByLabor.entries()).map(([key, v]) => ({
    tarea: key.split('|')[0],
    promedio: Math.round((v.sum / v.count) * 100) / 100,
    unidad: v.unidad,
    count: v.count,
  }))

  // --- diasParaCompletar ---
  const diasByTarea = new Map<string, { totalDias: number; count: number }>()
  for (const t of tareas) {
    if (t.estado !== 'finalizada' || !t.fechaFin) continue
    const dias = (t.fechaFin.toDate().getTime() - t.fechaInicio.toDate().getTime()) / (1000 * 60 * 60 * 24)
    const entry = diasByTarea.get(t.tarea) ?? { totalDias: 0, count: 0 }
    entry.totalDias += Math.max(0, dias)
    entry.count += 1
    diasByTarea.set(t.tarea, entry)
  }
  const diasParaCompletar = Array.from(diasByTarea.entries()).map(([tarea, v]) => ({
    tarea,
    diasPromedio: Math.round((v.totalDias / v.count) * 10) / 10,
    count: v.count,
  }))

  // --- operadoresActivos ---
  const operadores = new Set(partes.map(p => p.operador))
  const operadoresActivos = operadores.size

  // --- partesPorDia ---
  const diasDistintos = new Set(partes.map(p => toDateKey(p.cerradoEn.toDate())))
  const partesPorDia = diasDistintos.size > 0
    ? Math.round((partes.length / diasDistintos.size) * 10) / 10
    : 0

  // --- rendimientoPorPersona ---
  const rendPP = new Map<string, { sum: number; personas: number; unidad: string }>()
  for (const p of partes) {
    if (p.tipo !== 'manual' || p.rendimientoCantidad == null || !p.rendimientoUnidad) continue
    const personas = p.cantidadPersonas ?? 1
    const key = `${p.tarea}|${p.rendimientoUnidad}`
    const entry = rendPP.get(key) ?? { sum: 0, personas: 0, unidad: p.rendimientoUnidad }
    entry.sum += p.rendimientoCantidad
    entry.personas += personas
    rendPP.set(key, entry)
  }
  const rendimientoPorPersona = Array.from(rendPP.entries()).map(([key, v]) => ({
    tarea: key.split('|')[0],
    valor: v.personas > 0 ? Math.round((v.sum / v.personas) * 100) / 100 : 0,
    unidad: v.unidad,
  }))

  // --- utilizacionMaquinaria ---
  const maqMap = new Map<string, { modelo?: string; partes: number }>()
  for (const p of partes) {
    if (p.tipo !== 'mecanica' || !p.maquinaria) continue
    const key = p.maquinaria
    const entry = maqMap.get(key) ?? { modelo: p.maquinariaModelo, partes: 0 }
    entry.partes += 1
    if (!entry.modelo && p.maquinariaModelo) entry.modelo = p.maquinariaModelo
    maqMap.set(key, entry)
  }
  const utilizacionMaquinaria = Array.from(maqMap.entries()).map(([maquinaria, v]) => ({
    maquinaria,
    modelo: v.modelo,
    partes: v.partes,
  }))

  // --- avancePorFinca ---
  const fincaProgress = new Map<string, Set<string>>()
  for (const t of tareas) {
    if (t.estado !== 'en_progreso') continue
    let finalizados = fincaProgress.get(t.fincaId)
    if (!finalizados) {
      finalizados = new Set()
      fincaProgress.set(t.fincaId, finalizados)
    }
    for (const cid of t.cuadroIdsFinalizados ?? []) finalizados.add(cid)
  }

  const avancePorFinca = Array.from(fincaProgress.entries()).map(([fincaId, finalizados]) => {
    let hectareasFinalizadas = 0
    for (const cid of finalizados) hectareasFinalizadas += getHectareasCuadro(fincaId, cid)
    const hectareasTotales = getTotalHectareasFinca(fincaId)
    return {
      finca: fincaId,
      hectareasFinalizadas: Math.round(hectareasFinalizadas * 100) / 100,
      hectareasTotales: Math.round(hectareasTotales * 100) / 100,
      porcentaje: hectareasTotales > 0
        ? Math.round((hectareasFinalizadas / hectareasTotales) * 10000) / 100
        : 0,
    }
  })

  return {
    rendimientoPromedioPorLabor,
    diasParaCompletar,
    operadoresActivos,
    partesPorDia,
    rendimientoPorPersona,
    utilizacionMaquinaria,
    avancePorFinca,
  }
}
