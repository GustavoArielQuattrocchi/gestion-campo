import {
  collection,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
  type Firestore,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore'
import {
  DASHBOARD_QUERY_LIMIT,
  dashboardLookbackDate,
  type DashboardQueryFilters,
} from './firestoreDashboardQueryConfig'

export {
  DASHBOARD_LOOKBACK_DAYS,
  DASHBOARD_QUERY_LIMIT,
  dashboardLookbackDate,
  tareasQueryModes,
  type DashboardQueryFilters,
} from './firestoreDashboardQueryConfig'

export function dashboardLookbackTimestamp(now = new Date()): Timestamp {
  return Timestamp.fromDate(dashboardLookbackDate(now))
}

/**
 * Tareas en progreso (siempre, sin recorte por fecha).
 * Opcional: fincaNombre / tipo.
 */
export function buildTareasEnProgresoQuery(
  db: Firestore,
  filters: Pick<DashboardQueryFilters, 'finca' | 'tipo'>,
): Query {
  const constraints: QueryConstraint[] = [where('estado', '==', 'en_progreso')]
  if (filters.finca !== 'todas') {
    constraints.push(where('fincaNombre', '==', filters.finca))
  }
  if (filters.tipo !== 'todos') {
    constraints.push(where('tipo', '==', filters.tipo))
  }
  constraints.push(orderBy('fechaInicio', 'desc'))
  constraints.push(limit(DASHBOARD_QUERY_LIMIT))
  return query(collection(db, 'tareas'), ...constraints)
}

/**
 * Histórico reciente (últimos DASHBOARD_LOOKBACK_DAYS).
 * Si estado === 'finalizada', solo finalizadas; si 'todos', todo lo del período.
 */
export function buildTareasHistoricoQuery(
  db: Firestore,
  filters: DashboardQueryFilters,
  now = new Date(),
): Query {
  const constraints: QueryConstraint[] = [
    where('fechaInicio', '>=', dashboardLookbackTimestamp(now)),
  ]
  if (filters.finca !== 'todas') {
    constraints.push(where('fincaNombre', '==', filters.finca))
  }
  if (filters.tipo !== 'todos') {
    constraints.push(where('tipo', '==', filters.tipo))
  }
  if (filters.estado === 'finalizada') {
    constraints.push(where('estado', '==', 'finalizada'))
  }
  constraints.push(orderBy('fechaInicio', 'desc'))
  constraints.push(limit(DASHBOARD_QUERY_LIMIT))
  return query(collection(db, 'tareas'), ...constraints)
}

/**
 * Partes de labores del escritorio: ventana por abiertoEn + finca/tipo opcionales.
 */
export function buildPartesDashboardQuery(
  db: Firestore,
  filters: Pick<DashboardQueryFilters, 'finca' | 'tipo'>,
  now = new Date(),
): Query {
  const constraints: QueryConstraint[] = [
    where('abiertoEn', '>=', dashboardLookbackTimestamp(now)),
  ]
  if (filters.finca !== 'todas') {
    constraints.push(where('fincaId', '==', filters.finca))
  }
  if (filters.tipo !== 'todos') {
    constraints.push(where('tipo', '==', filters.tipo))
  }
  constraints.push(orderBy('abiertoEn', 'desc'))
  constraints.push(limit(DASHBOARD_QUERY_LIMIT))
  return query(collection(db, 'partes_labores'), ...constraints)
}

/** Tareas de un cuadro público (sin bajar toda la colección). */
export function buildCuadroTareasQuery(
  db: Firestore,
  fincaId: string,
  cuadroId: string,
): Query {
  return query(
    collection(db, 'tareas'),
    where('fincaId', '==', fincaId),
    where('cuadroIds', 'array-contains', cuadroId),
    orderBy('fechaInicio', 'desc'),
    limit(DASHBOARD_QUERY_LIMIT),
  )
}
