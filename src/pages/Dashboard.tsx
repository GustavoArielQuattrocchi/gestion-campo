import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import MetricDetailModal from '../components/dashboard/MetricDetailModal'
import DashboardContentModal from '../components/dashboard/DashboardContentModal'
import DashboardMapLayer from '../components/dashboard/DashboardMapLayer'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardSidebarToggle from '../components/dashboard/DashboardSidebarToggle'
import DashboardWeatherFloat from '../components/dashboard/DashboardWeatherFloat'
import DashboardPendingPartesAlert from '../components/dashboard/DashboardPendingPartesAlert'
import { METRIC_ACCENTS, DOTACION_ACCENT } from '../components/dashboard/dashboardConstants'
import { useDashboardTareas } from '../hooks/useDashboardTareas'
import { usePartesLabores } from '../hooks/usePartesLabores'
import { useInformesAccidente } from '../hooks/useInformesAccidente'
import { applyPartesDashboardFilters } from '../utils/dashboardFilters'
import { countPartesAbiertosVencidos } from '../utils/parteEstado'

const EnProgresoContent = lazy(() => import('../components/dashboard/EnProgresoContent'))
const PartesLaboresContent = lazy(() => import('../components/dashboard/PartesLaboresContent'))
const DotacionContent = lazy(() => import('../components/dashboard/DotacionContent'))
const AnalyticsContent = lazy(() => import('../components/dashboard/AnalyticsContent'))
const SafetyContent = lazy(() => import('../components/dashboard/SafetyContent'))

type ContentModalKey = 'en_progreso' | 'partes_labores' | 'dotacion' | 'analytics' | 'seguridad'

function ModalLoading() {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
      <Clock size={22} style={{ marginBottom: 8, opacity: 0.6 }} />
      <p style={{ margin: 0 }}>Cargando contenido...</p>
    </div>
  )
}

export default function Dashboard() {
  const {
    partes: partesLabores,
    loading: partesLaboresLoading,
    error: partesLaboresError,
    parseWarning: partesLaboresParseWarning,
  } = usePartesLabores()

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
    eliminarTarea,
    duplicadosCount,
    consolidarDuplicados,
    partesForStaffing,
  } = useDashboardTareas(partesLabores)

  const [contentModal, setContentModal] = useState<ContentModalKey | null>(null)

  const [loadInformes, setLoadInformes] = useState(false)
  useEffect(() => {
    if (loading) return
    const enable = () => setLoadInformes(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(enable, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(enable, 400)
    return () => window.clearTimeout(timer)
  }, [loading])

  const {
    informes: informesAccidente,
    loading: informesLoading,
    error: informesError,
    fincasDisponibles: informesFincas,
  } = useInformesAccidente(loadInformes || contentModal === 'seguridad')

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

  const partesVencidosCount = useMemo(
    () => countPartesAbiertosVencidos(partesGlobales),
    [partesGlobales],
  )

  const [pendingAlertDismissed, setPendingAlertDismissed] = useState(
    () => sessionStorage.getItem('escritorio-vencidos-alert-dismissed') === '1',
  )

  useEffect(() => {
    if (partesVencidosCount === 0) {
      sessionStorage.removeItem('escritorio-vencidos-alert-dismissed')
      setPendingAlertDismissed(false)
    }
  }, [partesVencidosCount])

  return (
    <div className={`dashboard-layout fade-in ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashboardMapLayer tareas={tareasFiltradas} filtroFinca={filtroFinca} />

      <DashboardWeatherFloat filtroFinca={filtroFinca} />

      {!pendingAlertDismissed && partesVencidosCount > 0 && (
        <DashboardPendingPartesAlert
          count={partesVencidosCount}
          onViewPartes={() => setContentModal('partes_labores')}
          onDismiss={() => {
            sessionStorage.setItem('escritorio-vencidos-alert-dismissed', '1')
            setPendingAlertDismissed(true)
          }}
        />
      )}

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
        accidentCount={informesAccidente.length}
        metricsNote={metricsNote}
        onSelectMetric={setSelectedMetric}
        onOpenEnProgreso={() => setContentModal('en_progreso')}
        onOpenPartesLabores={() => setContentModal('partes_labores')}
        onOpenDotacion={() => setContentModal('dotacion')}
        onOpenAnalytics={() => setContentModal('analytics')}
        onOpenSeguridad={() => setContentModal('seguridad')}
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

      {contentModal === 'en_progreso' && (
        <DashboardContentModal
          open
          title={`Trabajos en progreso (${enProgresoCount})`}
          accentColor={METRIC_ACCENTS.en_progreso}
          onClose={() => setContentModal(null)}
        >
          <Suspense fallback={<ModalLoading />}>
            <EnProgresoContent
              tareas={tareasFiltradas}
              filtroFinca={enProgresoFiltroFinca}
              filtroTarea={enProgresoFiltroTarea}
              duplicadosCount={duplicadosCount}
              onFiltroFincaChange={setEnProgresoFiltroFinca}
              onFiltroTareaChange={setEnProgresoFiltroTarea}
              onFinalizarCuadro={finalizarCuadro}
              onDeshacerFinalizacionCuadro={deshacerFinalizacionCuadro}
              onFinalizarTarea={finalizarTarea}
              onReabrirTarea={reabrirTarea}
              onEliminarTarea={eliminarTarea}
              onConsolidarDuplicados={consolidarDuplicados}
            />
          </Suspense>
        </DashboardContentModal>
      )}

      {contentModal === 'partes_labores' && (
        <DashboardContentModal
          open
          title={`Partes de labores (${partesGlobales.length})`}
          accentColor="#059669"
          onClose={() => setContentModal(null)}
        >
          <Suspense fallback={<ModalLoading />}>
            <PartesLaboresContent
              partes={partesGlobales}
              tareas={tareasFiltradas}
              loading={partesLaboresLoading}
              error={partesLaboresError}
              parseWarning={partesLaboresParseWarning}
              fincasDisponibles={partesFincas}
              filtroFinca={partesFiltroFinca}
              filtroOperador={partesFiltroOperador}
              onFiltroFincaChange={setPartesFiltroFinca}
              onFiltroOperadorChange={setPartesFiltroOperador}
            />
          </Suspense>
        </DashboardContentModal>
      )}

      {contentModal === 'dotacion' && (
        <DashboardContentModal
          open
          title={`Dotación (${stats.dotacionHoy} hoy)`}
          accentColor={DOTACION_ACCENT}
          onClose={() => setContentModal(null)}
        >
          <Suspense fallback={<ModalLoading />}>
            <DotacionContent partes={partesForStaffing} />
          </Suspense>
        </DashboardContentModal>
      )}

      {contentModal === 'analytics' && (
        <DashboardContentModal
          open
          title="Indicadores de productividad"
          accentColor="#8b5cf6"
          onClose={() => setContentModal(null)}
        >
          <Suspense fallback={<ModalLoading />}>
            <AnalyticsContent
              tareas={tareasFiltradas}
              partes={partesGlobales}
              partesStaffing={partesForStaffing}
            />
          </Suspense>
        </DashboardContentModal>
      )}

      {contentModal === 'seguridad' && (
        <DashboardContentModal
          open
          title={`Seguridad — Accidentes (${informesAccidente.length})`}
          accentColor="#ef4444"
          onClose={() => setContentModal(null)}
        >
          <Suspense fallback={<ModalLoading />}>
            <SafetyContent
              informes={informesAccidente}
              loading={informesLoading}
              error={informesError}
              fincasDisponibles={informesFincas}
            />
          </Suspense>
        </DashboardContentModal>
      )}
    </div>
  )
}
