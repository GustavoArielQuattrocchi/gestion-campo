import { Clock } from 'lucide-react'
import type { Tarea } from '../../types'
import type { DashboardStats } from '../../utils/dashboardMetrics'
import type { MetricKey } from '../../utils/getMetricDetail'
import type { DashboardPanelKey } from '../../hooks/useDashboardTareas'
import DashboardSidebarHeader from './DashboardSidebarHeader'
import DashboardStatsPanel from './DashboardStatsPanel'
import DashboardFiltersPanel from './DashboardFiltersPanel'
import DashboardTasksPanel from './DashboardTasksPanel'
import DashboardQrPanel from './qr/DashboardQrPanel'

interface Props {
  open: boolean
  loading: boolean
  error: string | null
  indexCreateUrl: string | null
  parseWarning: string | null
  actionError: string | null
  panelsOpen: Record<DashboardPanelKey, boolean>
  onTogglePanel: (key: DashboardPanelKey) => void
  stats: DashboardStats
  partesCount: number
  metricsNote: string | null
  accidentCount: number
  onSelectMetric: (key: MetricKey) => void
  onOpenEnProgreso: () => void
  onOpenPartesLabores: () => void
  onOpenAnalytics: () => void
  onOpenSeguridad: () => void
  filtroFinca: string
  filtroTipo: string
  filtroEstado: string
  fincasFiltro: string[]
  onFincaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onEstadoChange: (value: string) => void
  tareasTabla: Tarea[]
  hasMore: boolean
  onLoadMore: () => void
}

export default function DashboardSidebar({
  open,
  loading,
  error,
  indexCreateUrl,
  parseWarning,
  actionError,
  panelsOpen,
  onTogglePanel,
  stats,
  partesCount,
  accidentCount,
  metricsNote,
  onSelectMetric,
  onOpenEnProgreso,
  onOpenPartesLabores,
  onOpenAnalytics,
  onOpenSeguridad,
  filtroFinca,
  filtroTipo,
  filtroEstado,
  fincasFiltro,
  onFincaChange,
  onTipoChange,
  onEstadoChange,
  tareasTabla,
  hasMore,
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

        {!error && actionError && (
          <div className="dashboard-sidebar-error" role="alert">
            <strong>Error al actualizar tarea</strong>
            <p style={{ margin: '6px 0 0' }}>{actionError}</p>
          </div>
        )}

        {loading && !error && (
          <div className="dashboard-sidebar-loading">
            <Clock size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>Cargando tareas desde Firebase...</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <DashboardStatsPanel
              open={panelsOpen.resumen}
              onToggle={() => onTogglePanel('resumen')}
              stats={stats}
              partesCount={partesCount}
              accidentCount={accidentCount}
              metricsNote={metricsNote}
              onSelectMetric={onSelectMetric}
              onOpenEnProgreso={onOpenEnProgreso}
              onOpenPartesLabores={onOpenPartesLabores}
              onOpenAnalytics={onOpenAnalytics}
              onOpenSeguridad={onOpenSeguridad}
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

            <DashboardQrPanel
              open={panelsOpen.qr_cuadros}
              onToggle={() => onTogglePanel('qr_cuadros')}
            />

            <DashboardTasksPanel
              open={panelsOpen.tareas}
              onToggle={() => onTogglePanel('tareas')}
              tareas={tareasTabla}
              hasMore={hasMore}
              onLoadMore={onLoadMore}
            />
          </>
        )}
      </div>
    </aside>
  )
}
