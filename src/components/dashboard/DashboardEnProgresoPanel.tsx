import { useState } from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
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
  onFinalizarTarea: (tareaId: string) => Promise<void>
}

export default function DashboardEnProgresoPanel({
  open,
  onToggle,
  tareas,
  onFinalizarCuadro,
  onFinalizarTarea,
}: Props) {
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

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
      title={`Trabajos en progreso (${enProgreso.length})`}
      icon={<Clock size={16} />}
      open={open}
      onToggle={onToggle}
    >
      {enProgreso.length === 0 ? (
        <p className="dashboard-panel-empty">No hay tareas en progreso con los filtros actuales.</p>
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
                            const key = `${tarea.id}:${cuadroId}`
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
                          {progress.cuadrosFinalizados.map(cuadroId => (
                            <li key={cuadroId}>
                              <CheckCircle2 size={14} />
                              {getNombreCuadro(tarea.fincaId, cuadroId)}
                            </li>
                          ))}
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
                          ? 'Marcar la tarea como finalizada'
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
    </DashboardPanel>
  )
}
