import { useEffect, useMemo, useState } from 'react'
import { Clock, CheckCircle2, RotateCcw } from 'lucide-react'
import type { Tarea } from '../../types'
import { getNombreCuadro } from '../../data/fincaData'
import {
  allCuadrosTareaFinalizados,
  computeTareaProgress,
  formatProgressLabel,
} from '../../utils/tareaProgress'
import { formatTareaMapLabel } from '../../utils/vineyardMapLabels'
import DashboardPanel from './DashboardPanel'
import TaskProgressBar from './TaskProgressBar'

interface Props {
  open: boolean
  onToggle: () => void
  tareas: Tarea[]
  onFinalizarCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  onDeshacerFinalizacionCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  onFinalizarTarea: (tareaId: string) => Promise<void>
  onReabrirTarea: (tareaId: string) => Promise<void>
}

function matchesFiltros(
  tarea: Tarea,
  filtroFinca: string,
  filtroTarea: string,
): boolean {
  if (filtroFinca !== 'todas' && tarea.fincaNombre !== filtroFinca) return false
  if (filtroTarea !== 'todas' && tarea.tarea !== filtroTarea) return false
  return true
}

export default function DashboardEnProgresoPanel({
  open,
  onToggle,
  tareas,
  onFinalizarCuadro,
  onDeshacerFinalizacionCuadro,
  onFinalizarTarea,
  onReabrirTarea,
}: Props) {
  const enProgresoAll = useMemo(
    () => tareas.filter(t => t.estado === 'en_progreso'),
    [tareas],
  )
  const cerradasAll = useMemo(
    () => tareas.filter(t => t.estado === 'finalizada'),
    [tareas],
  )

  const [filtroFinca, setFiltroFinca] = useState('todas')
  const [filtroTarea, setFiltroTarea] = useState('todas')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const fincasOpciones = useMemo(
    () => [...new Set(enProgresoAll.map(t => t.fincaNombre))].sort(),
    [enProgresoAll],
  )

  const tareasOpciones = useMemo(() => {
    const base =
      filtroFinca === 'todas'
        ? enProgresoAll
        : enProgresoAll.filter(t => t.fincaNombre === filtroFinca)
    return [...new Set(base.map(t => t.tarea))].sort()
  }, [enProgresoAll, filtroFinca])

  useEffect(() => {
    if (filtroTarea !== 'todas' && !tareasOpciones.includes(filtroTarea)) {
      setFiltroTarea('todas')
    }
  }, [filtroTarea, tareasOpciones])

  const enProgreso = useMemo(
    () => enProgresoAll.filter(t => matchesFiltros(t, filtroFinca, filtroTarea)),
    [enProgresoAll, filtroFinca, filtroTarea],
  )

  const cerradas = useMemo(
    () => cerradasAll.filter(t => matchesFiltros(t, filtroFinca, filtroTarea)),
    [cerradasAll, filtroFinca, filtroTarea],
  )

  const runAction = async (key: string, action: () => Promise<void>) => {
    if (busyKey) return
    setBusyKey(key)
    try {
      await action()
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <DashboardPanel
      title={`Trabajos en progreso (${enProgresoAll.length})`}
      icon={<Clock size={16} />}
      open={open}
      onToggle={onToggle}
    >
      {enProgresoAll.length > 0 && (
        <div className="en-progreso-filters">
          <label className="en-progreso-filter">
            <span>Finca</span>
            <select
              className="form-select"
              value={filtroFinca}
              onChange={e => setFiltroFinca(e.target.value)}
            >
              <option value="todas">Todas las fincas</option>
              {fincasOpciones.map(finca => (
                <option key={finca} value={finca}>
                  {finca}
                </option>
              ))}
            </select>
          </label>
          <label className="en-progreso-filter">
            <span>Tarea</span>
            <select
              className="form-select"
              value={filtroTarea}
              onChange={e => setFiltroTarea(e.target.value)}
            >
              <option value="todas">Todas las tareas</option>
              {tareasOpciones.map(nombre => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {enProgresoAll.length === 0 ? (
        <p className="dashboard-panel-empty">No hay tareas en progreso con los filtros actuales.</p>
      ) : enProgreso.length === 0 ? (
        <p className="dashboard-panel-empty">Ninguna tarea coincide con finca y tarea seleccionadas.</p>
      ) : (
        <ul className="en-progreso-list">
          {enProgreso.map(tarea => {
            const progress = computeTareaProgress(tarea)
            const expanded = expandedId === tarea.id
            const puedeCerrar = allCuadrosTareaFinalizados(tarea)

            return (
              <li key={tarea.id} className="en-progreso-item">
                <button
                  type="button"
                  className="en-progreso-item-header"
                  onClick={() => setExpandedId(expanded ? null : tarea.id)}
                >
                  <div>
                    <strong>{tarea.tarea}</strong>
                    <span className="en-progreso-meta">
                      {tarea.fincaNombre} · {formatTareaMapLabel(tarea)}
                    </span>
                  </div>
                </button>

                <TaskProgressBar
                  value={progress.porcentaje}
                  label={formatProgressLabel(progress)}
                />

                {expanded && (
                  <div className="en-progreso-detail">
                    {progress.cuadrosPendientes.length > 0 && (
                      <div className="en-progreso-cuadros">
                        <h5>Cuadros pendientes</h5>
                        <ul>
                          {progress.cuadrosPendientes.map(cuadroId => {
                            const key = `${tarea.id}:fin:${cuadroId}`
                            return (
                              <li key={cuadroId}>
                                <span>{getNombreCuadro(tarea.fincaId, cuadroId)}</span>
                                <button
                                  type="button"
                                  className="btn-finalizar-cuadro"
                                  disabled={busyKey !== null}
                                  onClick={() =>
                                    runAction(key, () => onFinalizarCuadro(tarea.id, cuadroId))
                                  }
                                >
                                  {busyKey === key ? 'Guardando…' : 'Finalizar cuadro'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {progress.cuadrosFinalizados.length > 0 && (
                      <div className="en-progreso-cuadros en-progreso-cuadros--done">
                        <h5>Cuadros finalizados</h5>
                        <ul>
                          {progress.cuadrosFinalizados.map(cuadroId => {
                            const key = `${tarea.id}:undo:${cuadroId}`
                            return (
                              <li key={cuadroId}>
                                <span className="en-progreso-cuadro-label">
                                  <CheckCircle2 size={14} />
                                  {getNombreCuadro(tarea.fincaId, cuadroId)}
                                </span>
                                <button
                                  type="button"
                                  className="btn-deshacer-cuadro"
                                  disabled={busyKey !== null}
                                  onClick={() =>
                                    runAction(key, () =>
                                      onDeshacerFinalizacionCuadro(tarea.id, cuadroId),
                                    )
                                  }
                                >
                                  {busyKey === key ? 'Guardando…' : 'Deshacer'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {tarea.rendimientosDiarios && tarea.rendimientosDiarios.length > 0 && (
                      <div className="en-progreso-rendimientos">
                        <h5>Rendimientos diarios</h5>
                        <ul>
                          {[...tarea.rendimientosDiarios]
                            .reverse()
                            .slice(0, 5)
                            .map((r, i) => (
                              <li key={i}>
                                <strong>{r.operador}</strong> — {r.texto}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-cerrar-tarea"
                      disabled={!puedeCerrar || busyKey !== null}
                      title={
                        puedeCerrar
                          ? 'Marcar la tarea como finalizada en el dashboard'
                          : 'Finalizá todos los cuadros antes de cerrar la tarea'
                      }
                      onClick={() =>
                        runAction(`close:${tarea.id}`, () => onFinalizarTarea(tarea.id))
                      }
                    >
                      {busyKey === `close:${tarea.id}` ? 'Cerrando…' : 'Cerrar tarea'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {cerradas.length > 0 && (
        <div className="en-progreso-cerradas">
          <h5>Tareas cerradas ({cerradas.length})</h5>
          <ul className="en-progreso-list">
            {cerradas.map(tarea => {
              const key = `reopen:${tarea.id}`
              return (
                <li key={tarea.id} className="en-progreso-item en-progreso-item--cerrada">
                  <div>
                    <strong>{tarea.tarea}</strong>
                    <span className="en-progreso-meta">
                      {tarea.fincaNombre} · {formatTareaMapLabel(tarea)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-reabrir-tarea"
                    disabled={busyKey !== null}
                    onClick={() => runAction(key, () => onReabrirTarea(tarea.id))}
                  >
                    <RotateCcw size={14} />
                    {busyKey === key ? 'Reabriendo…' : 'Reabrir tarea'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </DashboardPanel>
  )
}
