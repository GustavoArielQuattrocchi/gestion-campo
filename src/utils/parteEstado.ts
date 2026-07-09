import { endOfDay, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ParteDeLabores, Tarea } from '../types'

export function isParteAbierto(parte: ParteDeLabores): boolean {
  return parte.estado === 'abierto'
}

export function isParteCerrado(parte: ParteDeLabores): boolean {
  return parte.estado === 'cerrado'
}

export function findParteAbierto(partes: ParteDeLabores[], tareaId: string): ParteDeLabores | undefined {
  return partes.find(p => p.tareaId === tareaId && p.estado === 'abierto')
}

export function tieneParteAbierto(partes: ParteDeLabores[], tareaId: string): boolean {
  return partes.some(p => p.tareaId === tareaId && p.estado === 'abierto')
}

export function isParteAbiertoHoy(parte: ParteDeLabores, referenceDate = new Date()): boolean {
  return isParteAbierto(parte) && isSameDay(parte.abiertoEn.toDate(), referenceDate)
}

/** Parte abierto de un día anterior sin cerrar. */
export function isParteAbiertoVencido(parte: ParteDeLabores, referenceDate = new Date()): boolean {
  return isParteAbierto(parte) && !isSameDay(parte.abiertoEn.toDate(), referenceDate)
}

export function filterPartesAbiertosHoy(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): ParteDeLabores[] {
  return partes.filter(p => isParteAbiertoHoy(p, referenceDate))
}

export function filterPartesAbiertosVencidos(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): ParteDeLabores[] {
  return partes.filter(p => isParteAbiertoVencido(p, referenceDate))
}

/** Tareas con parte de labores abierto (pendientes de cierre de jornada). */
export function filterTareasConParteAbierto(tareas: Tarea[], partesAbiertos: ParteDeLabores[]): Tarea[] {
  const ids = new Set(partesAbiertos.filter(isParteAbierto).map(p => p.tareaId))
  return tareas.filter(t => ids.has(t.id))
}

export function filterTareasConParteAbiertoHoy(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
  referenceDate = new Date(),
): Tarea[] {
  const ids = new Set(filterPartesAbiertosHoy(partesAbiertos, referenceDate).map(p => p.tareaId))
  return tareas.filter(t => ids.has(t.id))
}

export function filterTareasConParteVencido(
  tareas: Tarea[],
  partesAbiertos: ParteDeLabores[],
  referenceDate = new Date(),
): Tarea[] {
  const ids = new Set(filterPartesAbiertosVencidos(partesAbiertos, referenceDate).map(p => p.tareaId))
  return tareas.filter(t => ids.has(t.id))
}

/** Fecha de cierre: hoy → ahora; vencido → fin del día de apertura. */
export function resolveCerradoEn(parte: ParteDeLabores, referenceDate = new Date()): Date {
  const abierto = parte.abiertoEn.toDate()
  if (isSameDay(abierto, referenceDate)) return referenceDate
  return endOfDay(abierto)
}

export function formatParteAbiertoDia(parte: ParteDeLabores): string {
  return format(parte.abiertoEn.toDate(), "EEEE d 'de' MMMM", { locale: es })
}

export function parteSortKey(parte: ParteDeLabores): number {
  const ts = parte.estado === 'cerrado' && parte.cerradoEn ? parte.cerradoEn : parte.abiertoEn
  return ts.seconds
}

export function parteDiaClave(parte: ParteDeLabores): string {
  const ts =
    parte.estado === 'abierto'
      ? parte.abiertoEn
      : (parte.cerradoEn ?? parte.abiertoEn)
  return format(ts.toDate(), 'yyyy-MM-dd')
}

export function isParteCerradoHoy(parte: ParteDeLabores, referenceDate = new Date()): boolean {
  return (
    parte.estado === 'cerrado' &&
    !!parte.cerradoEn?.toDate &&
    isSameDay(parte.cerradoEn.toDate(), referenceDate)
  )
}

export interface PartesDashboardGroups {
  enEjecucionHoy: ParteDeLabores[]
  enEjecucionVencidos: ParteDeLabores[]
  cerradosHoy: ParteDeLabores[]
  historico: ParteDeLabores[]
}

export function groupPartesForDashboard(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): PartesDashboardGroups {
  const enEjecucionHoy: ParteDeLabores[] = []
  const enEjecucionVencidos: ParteDeLabores[] = []
  const cerradosHoy: ParteDeLabores[] = []
  const historico: ParteDeLabores[] = []

  for (const parte of partes) {
    if (isParteAbiertoHoy(parte, referenceDate)) {
      enEjecucionHoy.push(parte)
      continue
    }
    if (isParteAbiertoVencido(parte, referenceDate)) {
      enEjecucionVencidos.push(parte)
      continue
    }
    if (parte.cerradoEn?.toDate && isSameDay(parte.cerradoEn.toDate(), referenceDate)) {
      cerradosHoy.push(parte)
    } else if (parte.estado === 'cerrado') {
      historico.push(parte)
    }
  }

  const byDesc = (a: ParteDeLabores, b: ParteDeLabores) => parteSortKey(b) - parteSortKey(a)
  enEjecucionHoy.sort(byDesc)
  enEjecucionVencidos.sort(byDesc)
  cerradosHoy.sort(byDesc)
  historico.sort(byDesc)

  return { enEjecucionHoy, enEjecucionVencidos, cerradosHoy, historico }
}

export function historicoPorDia(partes: ParteDeLabores[]): Map<string, ParteDeLabores[]> {
  const map = new Map<string, ParteDeLabores[]>()
  for (const parte of partes) {
    if (!parte.cerradoEn?.toDate) continue
    const key = format(parte.cerradoEn.toDate(), 'yyyy-MM-dd')
    const list = map.get(key) ?? []
    list.push(parte)
    map.set(key, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => parteSortKey(b) - parteSortKey(a))
  }
  return new Map([...map.entries()].sort(([a], [b]) => b.localeCompare(a)))
}

export function countPartesAbiertosVencidos(
  partes: ParteDeLabores[],
  referenceDate = new Date(),
): number {
  return filterPartesAbiertosVencidos(partes, referenceDate).length
}
