import { lazy, Suspense, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMobileAppContext } from '../../contexts/MobileAppContext'
import { MOBILE_ROUTES } from '../../mobile/routes'
import { loadMobileSession } from '../../utils/mobileSession'
import { filterTareasPendientesParteLabores, tieneParteLaboresHoy } from '../../utils/parteLabores'
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
  const { getTareaActiva, handleRegisterRendimiento } = useMobileAppContext()

  if (!tareaId) {
    return <Navigate to={MOBILE_ROUTES.finalizar} replace />
  }

  const tarea = getTareaActiva(tareaId)
  if (!tarea || tieneParteLaboresHoy(tarea)) {
    return <Navigate to={MOBILE_ROUTES.finalizar} replace />
  }

  return (
    <EndTaskForm
      tarea={tarea}
      onSubmit={(cantidad, unidad, finalizarTarea, cuadrosFinalizadosHoy, extras) =>
        handleRegisterRendimiento(tareaId, cantidad, unidad, finalizarTarea, cuadrosFinalizadosHoy, extras)
      }
      onBack={() => navigate(MOBILE_ROUTES.finalizar)}
    />
  )
}

function ExitoRoute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { successMsg, lastCreatedTareaId, tareasActivas } = useMobileAppContext()
  const motivo = searchParams.get('motivo')

  const pendientesCierre = useMemo(
    () => filterTareasPendientesParteLabores(tareasActivas),
    [tareasActivas],
  )

  if (!motivo || !successMsg.message) {
    return <Navigate to={MOBILE_ROUTES.menu} replace />
  }

  return (
    <SuccessScreen
      message={successMsg.message}
      detail={successMsg.detail}
      motivo={motivo}
      pendientesCierreCount={pendientesCierre.length}
      lastCreatedTareaId={lastCreatedTareaId}
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

export default function MobileRoutes() {
  const navigate = useNavigate()
  const {
    fincaId,
    fincaNombre,
    tareasActivas,
    handleOperatorSubmit,
    handleStartManualTask,
    handleStartMechanicalTask,
    handleContinueTask,
  } = useMobileAppContext()

  const tareasPendientesCierre = useMemo(
    () => filterTareasPendientesParteLabores(tareasActivas),
    [tareasActivas],
  )

  const mensajeSinTareasCierre =
    tareasActivas.length > 0 && tareasPendientesCierre.length === 0
      ? 'Ya cerraste el parte de labores de todas las tareas en progreso hoy.'
      : 'No hay tareas en progreso'

  return (
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
              pendientesCierreCount={tareasPendientesCierre.length}
              onSelectInicio={() => navigate(MOBILE_ROUTES.tareaTipo)}
              onSelectFin={() => navigate(MOBILE_ROUTES.finalizar)}
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
              onSubmit={handleStartMechanicalTask}
              onContinue={(tareaId, cuadros, cuadroIds) => handleContinueTask(tareaId, cuadros, cuadroIds)}
              onBack={() => navigate(MOBILE_ROUTES.tareaTipo)}
            />
          }
        />
        <Route
          path="finalizar"
          element={
            <EndTaskList
              tareas={tareasPendientesCierre}
              fincaNombre={fincaNombre}
              emptyMessage={mensajeSinTareasCierre}
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
  )
}
