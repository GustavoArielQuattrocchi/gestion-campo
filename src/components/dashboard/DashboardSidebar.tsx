import { Clock } from 'lucide-react'
import type { Tarea, ParteDeLabores } from '../../types'
import type { DashboardStats } from '../../utils/dashboardMetrics'
import type { MetricKey } from '../../utils/getMetricDetail'
import type { DashboardPanelKey } from '../../hooks/useDashboardTareas'
import DashboardSidebarHeader from './DashboardSidebarHeader'
import DashboardStatsPanel from './DashboardStatsPanel'
import DashboardFiltersPanel from './DashboardFiltersPanel'
import DashboardTasksPanel from './DashboardTasksPanel'
import DashboardEnProgresoPanel from './DashboardEnProgresoPanel'
import DashboardPartesLaboresPanel from './DashboardPartesLaboresPanel'

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
  metricsNote: string | null
  onSelectMetric: (key: MetricKey) => void
  filtroFinca: string
  filtroTipo: string
  filtroEstado: string
  fincasFiltro: string[]
  onFincaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onEstadoChange: (value: string) => void
  tareasTabla: Tarea[]
  tareasGestion: Tarea[]
  hasMore: boolean
  onLoadMore: () => void
  finalizarCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  deshacerFinalizacionCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  finalizarTarea: (tareaId: string) => Promise<void>
  reabrirTarea: (tareaId: string) => Promise<void>
  partesLabores: ParteDeLabores[]
  partesLaboresLoading: boolean
  partesLaboresError: string | null
  partesLaboresParseWarning: string | null
  partesLaboresFincas: string[]
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
  metricsNote,
  onSelectMetric,
  filtroFinca,
  filtroTipo,
  filtroEstado,
  fincasFiltro,
  onFincaChange,
  onTipoChange,
  onEstadoChange,
  tareasTabla,
  tareasGestion,
  hasMore,
  onLoadMore,
  finalizarCuadro,
  deshacerFinalizacionCuadro,
  finalizarTarea,
  reabrirTarea,
  partesLabores,
  partesLaboresLoading,
  partesLaboresError,
  partesLaboresParseWarning,
  partesLaboresFincas,
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
              metricsNote={metricsNote}
              onSelectMetric={onSelectMetric}
            />

            <DashboardEnProgresoPanel
              open={panelsOpen.en_progreso}
              onToggle={() => onTogglePanel('en_progreso')}
              tareas={tareasGestion}
              onFinalizarCuadro={finalizarCuadro}
              onDeshacerFinalizacionCuadro={deshacerFinalizacionCuadro}
              onFinalizarTarea={finalizarTarea}
              onReabrirTarea={reabrirTarea}
            />

            <DashboardPartesLaboresPanel
              open={panelsOpen.partes_labores}
              onToggle={() => onTogglePanel('partes_labores')}
              partes={partesLabores}
              loading={partesLaboresLoading}
              error={partesLaboresError}
              parseWarning={partesLaboresParseWarning}
              fincasDisponibles={partesLaboresFincas}
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
