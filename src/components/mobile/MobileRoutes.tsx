import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMobileAppContext } from '../../contexts/MobileAppContext'
import { MOBILE_ROUTES } from '../../mobile/routes'
import { loadMobileSession } from '../../utils/mobileSession'
import { filterTareasPendientesHoy, filterTareasPendientesVencidas } from '../../utils/parteLabores'
import { findParteAbierto, isParteAbiertoHoy, isParteAbiertoVencido, tieneParteAbierto } from '../../utils/parteEstado'
import PendingPartesBanner from './PendingPartesBanner'
import StartScreen from './StartScreen'
import OperatorNameScreen from './OperatorNameScreen'
import WelcomeScreen from './WelcomeScreen'
import FincaSelector from './FincaSelector'
import TaskMenu from './TaskMenu'
import TaskTypeSelector from './TaskTypeSelector'
import ManualTaskForm from './ManualTaskForm'
import MechanicalTaskForm from './MechanicalTaskForm'
import EndTaskList from './EndTaskList'
import EndTaskForm from './EndTaskForm'
import SuccessScreen from './SuccessScreen'
import MobileRequireSession from './MobileRequireSession'

const AccidentReportForm = lazy(() => import('./AccidentReportForm'))
const VENCIDOS_BANNER_KEY = 'campo-vencidos-banner-dismissed'

function CampoIndexRedirect() {
  return <Navigate to={loadMobileSession() ? MOBILE_ROUTES.menu : MOBILE_ROUTES.inicio} replace />
}

function BienvenidaRoute() {
  const { operadorNombre, handleWelcomeDone } = useMobileAppContext()

  if (!operadorNombre.trim()) {
    return <Navigate to={MOBILE_ROUTES.registro} replace />
  }

  return <WelcomeScreen nombre={operadorNombre} onDone={handleWelcomeDone} />
}

function FincaRoute() {
  const { operadorNombre, goToInicio, handleSelectFinca } = useMobileAppContext()

  if (!operadorNombre.trim()) {
    return <Navigate to={MOBILE_ROUTES.registro} replace />
  }

  return <FincaSelector onSelect={handleSelectFinca} onBack={goToInicio} />
}

function FinalizarDetalleRoute() {
  const { tareaId } = useParams<{ tareaId: string }>()
  const navigate = useNavigate()
  const { getTareaActiva, partesAbiertos, handleRegisterRendimiento } = useMobileAppContext()

  if (!tareaId) {
    return <Navigate to={MOBILE_ROUTES.finalizar} replace />
  }

  const tarea = getTareaActiva(tareaId)
  const parte = findParteAbierto(partesAbiertos, tareaId)
  const esVencido = parte ? isParteAbiertoVencido(parte) : false
  const esHoy = parte ? isParteAbiertoHoy(parte) : false

  if (!tarea || !parte || (!esVencido && !esHoy)) {
    return <Navigate to={MOBILE_ROUTES.finalizar} replace />
  }

  return (
    <EndTaskForm
      tarea={tarea}
      parteAbierto={parte}
      onSubmit={(cantidad, unidad, extras) =>
        handleRegisterRendimiento(tareaId, cantidad, unidad, extras)
      }
      onBack={() => navigate(esVencido ? MOBILE_ROUTES.finalizarVencidos : MOBILE_ROUTES.finalizar)}
    />
  )
}

function ExitoRoute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { successMsg, lastCreatedTareaId, tareasActivas, partesAbiertos } = useMobileAppContext()
  const motivo = searchParams.get('motivo')

  const pendientesHoy = useMemo(
    () => filterTareasPendientesHoy(tareasActivas, partesAbiertos),
    [tareasActivas, partesAbiertos],
  )

  if (!motivo || !successMsg.message) {
    return <Navigate to={MOBILE_ROUTES.menu} replace />
  }

  const puedeCerrarParte =
    motivo === 'inicio' &&
    !!lastCreatedTareaId &&
    tieneParteAbierto(partesAbiertos, lastCreatedTareaId)

  return (
    <SuccessScreen
      message={successMsg.message}
      detail={successMsg.detail}
      motivo={motivo}
      pendientesCierreCount={pendientesHoy.length}
      lastCreatedTareaId={puedeCerrarParte ? lastCreatedTareaId : null}
      onContinue={() => navigate(MOBILE_ROUTES.menu)}
      onCerrarParte={tareaId => navigate(MOBILE_ROUTES.finalizarDetalle(tareaId))}
      onCargarOtra={() => navigate(MOBILE_ROUTES.tareaTipo)}
      onCerrarSiguiente={() => navigate(MOBILE_ROUTES.finalizar)}
    />
  )
}

function InformeRoute() {
  const navigate = useNavigate()
  const { operadorNombre, fincaId, fincaNombre, handleAccidentSuccess } = useMobileAppContext()

  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: 24, textAlign: 'center', color: 'var(--gray-500)' }}>
          <Clock size={24} style={{ marginBottom: 8 }} />
          <p>Cargando formulario...</p>
        </div>
      }
    >
      <AccidentReportForm
        operadorNombre={operadorNombre}
        fincaId={fincaId}
        fincaNombre={fincaNombre}
        onBack={() => navigate(MOBILE_ROUTES.menu)}
        onSuccess={handleAccidentSuccess}
      />
    </Suspense>
  )
}

function PendingPartesBannerGate() {
  const navigate = useNavigate()
  const { partesAbiertos } = useMobileAppContext()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(VENCIDOS_BANNER_KEY) === '1')

  const vencidosCount = useMemo(
    () => partesAbiertos.filter(p => isParteAbiertoVencido(p)).length,
    [partesAbiertos],
  )

  useEffect(() => {
    if (vencidosCount === 0) {
      sessionStorage.removeItem(VENCIDOS_BANNER_KEY)
      setDismissed(false)
    }
  }, [vencidosCount])

  if (dismissed || vencidosCount === 0) return null

  return (
    <PendingPartesBanner
      count={vencidosCount}
      onGoToVencidos={() => navigate(MOBILE_ROUTES.finalizarVencidos)}
      onDismiss={() => {
        sessionStorage.setItem(VENCIDOS_BANNER_KEY, '1')
        setDismissed(true)
      }}
    />
  )
}

export default function MobileRoutes() {
  const navigate = useNavigate()
  const {
    fincaId,
    fincaNombre,
    tareasActivas,
    partesAbiertos,
    handleOperatorSubmit,
    handleStartManualTask,
    handleStartMechanicalTask,
    handleContinueTask,
  } = useMobileAppContext()

  const tareasPendientesHoy = useMemo(
    () => filterTareasPendientesHoy(tareasActivas, partesAbiertos),
    [tareasActivas, partesAbiertos],
  )

  const tareasPendientesVencidas = useMemo(
    () => filterTareasPendientesVencidas(tareasActivas, partesAbiertos),
    [tareasActivas, partesAbiertos],
  )

  const mensajeSinTareasCierre =
    tareasActivas.length > 0
      ? 'No hay partes de labores abiertos hoy para cerrar.'
      : 'No hay tareas en progreso'

  const mensajeSinVencidos =
    tareasActivas.length > 0
      ? 'No hay partes pendientes de días anteriores.'
      : 'No hay tareas en progreso'

  return (
    <>
      <PendingPartesBannerGate />
      <Routes>
        <Route index element={<CampoIndexRedirect />} />
        <Route
          path="inicio"
          element={<StartScreen onStart={() => navigate(MOBILE_ROUTES.registro)} />}
        />
        <Route path="registro" element={<OperatorNameScreen onSubmit={handleOperatorSubmit} />} />
        <Route path="bienvenida" element={<BienvenidaRoute />} />
        <Route path="finca" element={<FincaRoute />} />

        <Route element={<MobileRequireSession />}>
          <Route
            path="menu"
            element={
              <TaskMenu
                fincaNombre={fincaNombre}
                tareasActivas={tareasActivas}
                partesAbiertos={partesAbiertos}
                pendientesHoyCount={tareasPendientesHoy.length}
                pendientesVencidosCount={tareasPendientesVencidas.length}
                onSelectInicio={() => navigate(MOBILE_ROUTES.tareaTipo)}
                onSelectFin={() => navigate(MOBILE_ROUTES.finalizar)}
                onSelectFinVencidos={() => navigate(MOBILE_ROUTES.finalizarVencidos)}
                onSelectAccidente={() => navigate(MOBILE_ROUTES.informe)}
                onCerrarTarea={tareaId => navigate(MOBILE_ROUTES.finalizarDetalle(tareaId))}
                onBack={() => navigate(MOBILE_ROUTES.finca)}
              />
            }
          />
          <Route
            path="tarea/tipo"
            element={
              <TaskTypeSelector
                onSelectManual={() => navigate(MOBILE_ROUTES.tareaManual)}
                onSelectMecanica={() => navigate(MOBILE_ROUTES.tareaMecanica)}
                onBack={() => navigate(MOBILE_ROUTES.menu)}
              />
            }
          />
          <Route
            path="tarea/manual"
            element={
              <ManualTaskForm
                fincaNombre={fincaNombre}
                tareasActivas={tareasActivas}
                partesAbiertos={partesAbiertos}
                onSubmit={handleStartManualTask}
                onContinue={handleContinueTask}
                onBack={() => navigate(MOBILE_ROUTES.tareaTipo)}
              />
            }
          />
          <Route
            path="tarea/mecanica"
            element={
              <MechanicalTaskForm
                fincaId={fincaId}
                fincaNombre={fincaNombre}
                tareasActivas={tareasActivas}
                partesAbiertos={partesAbiertos}
                onSubmit={handleStartMechanicalTask}
                onContinue={handleContinueTask}
                onBack={() => navigate(MOBILE_ROUTES.tareaTipo)}
              />
            }
          />
          <Route
            path="finalizar"
            element={
              <EndTaskList
                tareas={tareasPendientesHoy}
                partesAbiertos={partesAbiertos}
                fincaNombre={fincaNombre}
                emptyMessage={mensajeSinTareasCierre}
                onSelectTarea={tarea => navigate(MOBILE_ROUTES.finalizarDetalle(tarea.id))}
                onBack={() => navigate(MOBILE_ROUTES.menu)}
              />
            }
          />
          <Route
            path="finalizar/vencidos"
            element={
              <EndTaskList
                tareas={tareasPendientesVencidas}
                partesAbiertos={partesAbiertos}
                fincaNombre={fincaNombre}
                title="Cierres pendientes"
                subtitle={`${fincaNombre} — Partes de días anteriores sin cerrar`}
                emptyMessage={mensajeSinVencidos}
                showFechaApertura
                onSelectTarea={tarea => navigate(MOBILE_ROUTES.finalizarDetalle(tarea.id))}
                onBack={() => navigate(MOBILE_ROUTES.menu)}
              />
            }
          />
          <Route path="finalizar/:tareaId" element={<FinalizarDetalleRoute />} />
          <Route path="informe" element={<InformeRoute />} />
          <Route path="exito" element={<ExitoRoute />} />
        </Route>

        <Route path="*" element={<Navigate to={MOBILE_ROUTES.root} replace />} />
      </Routes>
    </>
  )
}
