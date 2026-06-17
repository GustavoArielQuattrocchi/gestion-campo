import { Clock } from 'lucide-react'
import type { Tarea } from '../../types'
import type { DashboardStats } from '../../utils/dashboardMetrics'
import type { MetricKey } from '../../utils/getMetricDetail'
import type { DashboardPanelKey } from '../../hooks/useDashboardTareas'
import DashboardSidebarHeader from './DashboardSidebarHeader'
import DashboardStatsPanel from './DashboardStatsPanel'
import DashboardFiltersPanel from './DashboardFiltersPanel'
import DashboardTasksPanel from './DashboardTasksPanel'

interface Props {
  open: boolean
  loading: boolean
  error: string | null
  indexCreateUrl: string | null
  parseWarning: string | null
  panelsOpen: Record<DashboardPanelKey, boolean>
  onTogglePanel: (key: DashboardPanelKey) => void
  stats: DashboardStats
  metricsNote: string | null
  onSelectMetric: (key: MetricKey) => void
  filtroFinca: string
  filtroTipo: string
  filtroEstado: string
  fincasFiltro: string[]
  onFincaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onEstadoChange: (value: string) => void
  tareasFiltradas: Tarea[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export default function DashboardSidebar({
  open,
  loading,
  error,
  indexCreateUrl,
  parseWarning,
  panelsOpen,
  onTogglePanel,
  stats,
  metricsNote,
  onSelectMetric,
  filtroFinca,
  filtroTipo,
  filtroEstado,
  fincasFiltro,
  onFincaChange,
  onTipoChange,
  onEstadoChange,
  tareasFiltradas,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  return (
    <aside className={`dashboard-sidebar ${open ? '' : 'is-collapsed'}`} aria-hidden={!open}>
      <DashboardSidebarHeader />

      <div className="dashboard-sidebar-body">
        {error && (
          <div className="dashboard-sidebar-error" role="alert">
            <strong>{indexCreateUrl ? 'Índice de Firestore requerido' : 'Error al conectar con Firebase'}</strong>
            <p style={{ margin: '6px 0 0' }}>{error}</p>
            {indexCreateUrl ? (
              <p style={{ marginTop: 8, fontSize: 12 }}>
                <a href={indexCreateUrl} target="_blank" rel="noopener noreferrer">
                  Crear índice en Firebase Console
                </a>
                {' '}→ luego recargá esta página.
              </p>
            ) : (
              <p style={{ marginTop: 6, fontSize: 12, color: '#b91c1c' }}>
                Verificá las reglas de Firestore. Deben permitir lectura en &quot;tareas&quot;.
              </p>
            )}
          </div>
        )}

        {!error && parseWarning && (
          <div className="dashboard-sidebar-warning" role="status">
            <strong>Datos parcialmente cargados</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>{parseWarning}</p>
          </div>
        )}

        {loading && !error && (
          <div className="dashboard-sidebar-loading">
            <Clock size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>Cargando tareas desde Firebase...</p>
          </div>
        )}

        <DashboardStatsPanel
          open={panelsOpen.resumen}
          onToggle={() => onTogglePanel('resumen')}
          stats={stats}
          metricsNote={metricsNote}
          onSelectMetric={onSelectMetric}
        />

        <DashboardFiltersPanel
          open={panelsOpen.filtros}
          onToggle={() => onTogglePanel('filtros')}
          filtroFinca={filtroFinca}
          filtroTipo={filtroTipo}
          filtroEstado={filtroEstado}
          fincasFiltro={fincasFiltro}
          onFincaChange={onFincaChange}
          onTipoChange={onTipoChange}
          onEstadoChange={onEstadoChange}
        />

        <DashboardTasksPanel
          open={panelsOpen.tareas}
          onToggle={() => onTogglePanel('tareas')}
          tareas={tareasFiltradas}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
        />
      </div>
    </aside>
  )
}
