import MetricDetailModal from '../components/dashboard/MetricDetailModal'
import DashboardMapLayer from '../components/dashboard/DashboardMapLayer'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardSidebarToggle from '../components/dashboard/DashboardSidebarToggle'
import { METRIC_ACCENTS } from '../components/dashboard/dashboardConstants'
import { useDashboardTareas } from '../hooks/useDashboardTareas'

export default function Dashboard() {
  const {
    loading,
    error,
    indexCreateUrl,
    parseWarning,
    sidebarOpen,
    setSidebarOpen,
    panelsOpen,
    togglePanel,
    filtroFinca,
    setFiltroFinca,
    filtroTipo,
    setFiltroTipo,
    filtroEstado,
    setFiltroEstado,
    fincasFiltro,
    tareasFiltradas,
    tareasEnTabla,
    stats,
    selectedMetric,
    setSelectedMetric,
    metricDetail,
    hasMore,
    loadingMore,
    loadMore,
    metricsNote,
    actionError,
    finalizarCuadro,
    finalizarTarea,
  } = useDashboardTareas()

  return (
    <div className={`dashboard-layout fade-in ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashboardMapLayer tareas={tareasFiltradas} filtroFinca={filtroFinca} />

      <DashboardSidebar
        open={sidebarOpen}
        loading={loading}
        error={error}
        indexCreateUrl={indexCreateUrl}
        parseWarning={parseWarning}
        actionError={actionError}
        panelsOpen={panelsOpen}
        onTogglePanel={togglePanel}
        stats={stats}
        metricsNote={metricsNote}
        onSelectMetric={setSelectedMetric}
        filtroFinca={filtroFinca}
        filtroTipo={filtroTipo}
        filtroEstado={filtroEstado}
        fincasFiltro={fincasFiltro}
        onFincaChange={setFiltroFinca}
        onTipoChange={setFiltroTipo}
        onEstadoChange={setFiltroEstado}
        tareasFiltradas={tareasEnTabla}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        finalizarCuadro={finalizarCuadro}
        finalizarTarea={finalizarTarea}
      />

      <DashboardSidebarToggle
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <MetricDetailModal
        open={selectedMetric !== null}
        title={metricDetail?.title ?? ''}
        accentColor={selectedMetric ? METRIC_ACCENTS[selectedMetric] : undefined}
        loading={loading}
        columns={metricDetail?.columns ?? []}
        rows={metricDetail?.rows ?? []}
        summary={metricDetail?.summary}
        onClose={() => setSelectedMetric(null)}
      />
    </div>
  )
}
