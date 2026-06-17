import {
  collection,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { TAREAS_PAGE_SIZE } from './dashboardState'

export { TAREAS_PAGE_SIZE }

export interface DashboardTareasFilters {
  finca: string
  tipo: string
  estado: string
}

function filterConstraints(filters: DashboardTareasFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = []
  if (filters.finca !== 'todas') {
    constraints.push(where('fincaNombre', '==', filters.finca))
  }
  if (filters.tipo !== 'todos') {
    constraints.push(where('tipo', '==', filters.tipo))
  }
  if (filters.estado !== 'todos') {
    constraints.push(where('estado', '==', filters.estado))
  }
  return constraints
}

export function buildDashboardTareasQuery(
  filters: DashboardTareasFilters,
  pageSize = TAREAS_PAGE_SIZE,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [
    ...filterConstraints(filters),
    orderBy('fechaInicio', 'desc'),
  ]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }
  constraints.push(limit(pageSize))
  return query(collection(db, 'tareas'), ...constraints)
}
