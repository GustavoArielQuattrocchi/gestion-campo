import { useMemo, useState } from 'react'
import MetricDetailModal from '../components/dashboard/MetricDetailModal'
import DashboardContentModal from '../components/dashboard/DashboardContentModal'
import EnProgresoContent from '../components/dashboard/EnProgresoContent'
import PartesLaboresContent from '../components/dashboard/PartesLaboresContent'
import DashboardMapLayer from '../components/dashboard/DashboardMapLayer'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardSidebarToggle from '../components/dashboard/DashboardSidebarToggle'
import { METRIC_ACCENTS } from '../components/dashboard/dashboardConstants'
import { useDashboardTareas } from '../hooks/useDashboardTareas'
import { usePartesLabores } from '../hooks/usePartesLabores'
import { applyPartesDashboardFilters } from '../utils/dashboardFilters'

type ContentModalKey = 'en_progreso' | 'partes_labores'

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
    loadMore,
    metricsNote,
    actionError,
    finalizarCuadro,
    deshacerFinalizacionCuadro,
    finalizarTarea,
    reabrirTarea,
  } = useDashboardTareas()

  const {
    partes: partesLabores,
    loading: partesLaboresLoading,
    error: partesLaboresError,
    parseWarning: partesLaboresParseWarning,
  } = usePartesLabores()

  const [contentModal, setContentModal] = useState<ContentModalKey | null>(null)
  const [enProgresoFiltroFinca, setEnProgresoFiltroFinca] = useState('todas')
  const [enProgresoFiltroTarea, setEnProgresoFiltroTarea] = useState('todas')
  const [partesFiltroFinca, setPartesFiltroFinca] = useState('todas')
  const [partesFiltroOperador, setPartesFiltroOperador] = useState('todos')

  const partesGlobales = useMemo(
    () => applyPartesDashboardFilters(partesLabores, filtroFinca, filtroTipo, filtroEstado),
    [partesLabores, filtroFinca, filtroTipo, filtroEstado],
  )

  const partesFincas = useMemo(
    () => [...new Set(partesGlobales.map(p => p.fincaNombre))].sort(),
    [partesGlobales],
  )

  const enProgresoCount = stats.enProgreso

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
        partesCount={partesGlobales.length}
        metricsNote={metricsNote}
        onSelectMetric={setSelectedMetric}
        onOpenEnProgreso={() => setContentModal('en_progreso')}
        onOpenPartesLabores={() => setContentModal('partes_labores')}
        filtroFinca={filtroFinca}
        filtroTipo={filtroTipo}
        filtroEstado={filtroEstado}
        fincasFiltro={fincasFiltro}
        onFincaChange={setFiltroFinca}
        onTipoChange={setFiltroTipo}
        onEstadoChange={setFiltroEstado}
        tareasTabla={tareasEnTabla}
        hasMore={hasMore}
        onLoadMore={loadMore}
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

      <DashboardContentModal
        open={contentModal === 'en_progreso'}
        title={`Trabajos en progreso (${enProgresoCount})`}
        accentColor={METRIC_ACCENTS.en_progreso}
        onClose={() => setContentModal(null)}
      >
        <EnProgresoContent
          tareas={tareasFiltradas}
          filtroFinca={enProgresoFiltroFinca}
          filtroTarea={enProgresoFiltroTarea}
          onFiltroFincaChange={setEnProgresoFiltroFinca}
          onFiltroTareaChange={setEnProgresoFiltroTarea}
          onFinalizarCuadro={finalizarCuadro}
          onDeshacerFinalizacionCuadro={deshacerFinalizacionCuadro}
          onFinalizarTarea={finalizarTarea}
          onReabrirTarea={reabrirTarea}
        />
      </DashboardContentModal>

      <DashboardContentModal
        open={contentModal === 'partes_labores'}
        title={`Partes de labores (${partesGlobales.length})`}
        accentColor="#059669"
        onClose={() => setContentModal(null)}
      >
        <PartesLaboresContent
          partes={partesGlobales}
          loading={partesLaboresLoading}
          error={partesLaboresError}
          parseWarning={partesLaboresParseWarning}
          fincasDisponibles={partesFincas}
          filtroFinca={partesFiltroFinca}
          filtroOperador={partesFiltroOperador}
          onFiltroFincaChange={setPartesFiltroFinca}
          onFiltroOperadorChange={setPartesFiltroOperador}
        />
      </DashboardContentModal>
    </div>
  )
}
