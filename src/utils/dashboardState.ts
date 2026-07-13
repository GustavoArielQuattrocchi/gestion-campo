export const TAREAS_PAGE_SIZE = 100

export function readFilterParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
  allowed: Set<string>,
): string {
  const value = searchParams.get(key)
  if (value && allowed.has(value)) return value
  return fallback
}

export function buildFilterSearchParams(
  filtroFinca: string,
  filtroTipo: string,
  filtroEstado: string,
  filtroTareaMapa = 'todas',
): URLSearchParams {
  const params = new URLSearchParams()
  if (filtroFinca !== 'todas') params.set('finca', filtroFinca)
  if (filtroTipo !== 'todos') params.set('tipo', filtroTipo)
  if (filtroEstado !== 'todos') params.set('estado', filtroEstado)
  if (filtroTareaMapa !== 'todas') params.set('tarea', filtroTareaMapa)
  return params
}

export function paginateTareas<T>(items: T[], visibleCount: number): T[] {
  return items.slice(0, visibleCount)
}

export function hasMoreTareas(total: number, visibleCount: number): boolean {
  return visibleCount < total
}

export function nextVisibleCount(current: number, total: number, pageSize = TAREAS_PAGE_SIZE): number {
  return Math.min(current + pageSize, total)
}

export function buildMetricsNote(visibleInTable: number, totalFiltered: number, hasMore: boolean): string | null {
  if (!hasMore) return null
  return `La tabla muestra ${visibleInTable} de ${totalFiltered} tareas con estos filtros. Las métricas usan el total filtrado.`
}

export function buildInvalidDocsWarning(count: number, entity = 'registro'): string | null {
  if (count <= 0) return null
  const plural = count !== 1
  return `${count} ${entity}${plural ? 's' : ''} de Firestore no pudieron cargarse (datos incompletos o inválidos).`
}

export function buildActiveTasksWarning(count: number): string | null {
  if (count <= 0) return null
  const plural = count !== 1
  return `${count} tarea${plural ? 's' : ''} activa${plural ? 's' : ''} no pudo cargarse por datos inválidos.`
}
