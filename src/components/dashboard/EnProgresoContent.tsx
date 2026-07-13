import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Merge, RotateCcw, Trash2 } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import { getNombreCuadro } from '../../data/fincaData'
import {
  allCuadrosTareaFinalizados,
  computeTareaProgress,
  formatProgressLabel,
} from '../../utils/tareaProgress'
import { hasMultipleEjecutores } from '../../utils/tareaEjecutorBreakdown'
import EjecutorBreakdownSection from './EjecutorBreakdownSection'
import TaskProgressBar from './TaskProgressBar'

interface Props {
  tareas: Tarea[]
  partes: ParteDeLabores[]
  filtroFinca: string
  filtroTarea: string
  duplicadosCount: number
  onFiltroFincaChange: (value: string) => void
  onFiltroTareaChange: (value: string) => void
  onFinalizarCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  onDeshacerFinalizacionCuadro: (tareaId: string, cuadroId: string) => Promise<void>
  onFinalizarTarea: (tareaId: string) => Promise<void>
  onReabrirTarea: (tareaId: string) => Promise<void>
  onEliminarTarea: (tareaId: string) => Promise<void>
  onConsolidarDuplicados: () => Promise<number>
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

export default function EnProgresoContent({
  tareas,
  partes,
  filtroFinca,
  filtroTarea,
  duplicadosCount,
  onFiltroFincaChange,
  onFiltroTareaChange,
  onFinalizarCuadro,
  onDeshacerFinalizacionCuadro,
  onFinalizarTarea,
  onReabrirTarea,
  onEliminarTarea,
  onConsolidarDuplicados,
}: Props) {
  const enProgresoAll = useMemo(
    () => tareas.filter(t => t.estado === 'en_progreso'),
    [tareas],
  )
  const cerradasAll = useMemo(
    () => tareas.filter(t => t.estado === 'finalizada'),
    [tareas],
  )

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
      onFiltroTareaChange('todas')
    }
  }, [filtroTarea, tareasOpciones, onFiltroTareaChange])

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

  const confirmarEliminar = (tarea: Tarea) => {
    const ok = window.confirm(
      `¿Eliminar definitivamente la tarea "${tarea.tarea}" (${tarea.fincaNombre})?\n\n` +
        'Se borrará la tarea y todos sus partes de labores asociados. Esta acción no se puede deshacer.',
    )
    if (!ok) return
    void runAction(`delete:${tarea.id}`, () => onEliminarTarea(tarea.id))
  }

  return (
    <>
      {(enProgresoAll.length > 0 || cerradasAll.length > 0) && (
        <div className="en-progreso-filters">
          <label className="en-progreso-filter">
            <span>Finca</span>
            <select
              className="form-select"
              value={filtroFinca}
              onChange={e => onFiltroFincaChange(e.target.value)}
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
              onChange={e => onFiltroTareaChange(e.target.value)}
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

      {duplicadosCount > 0 && (
        <div className="consolidar-banner">
          <div className="consolidar-banner-text">
            <Merge size={16} />
            <span>
              Hay <strong>{duplicadosCount} tarea{duplicadosCount > 1 ? 's' : ''} duplicada{duplicadosCount > 1 ? 's' : ''}</strong> que
              pueden consolidarse (misma finca + labor).
            </span>
          </div>
          <button
            type="button"
            className="btn-consolidar"
            disabled={busyKey !== null}
            onClick={() =>
              runAction('consolidar', async () => {
                const n = await onConsolidarDuplicados()
                window.alert(`Se consolidaron ${n} tarea${n > 1 ? 's' : ''} duplicada${n > 1 ? 's' : ''}.`)
              })
            }
          >
            {busyKey === 'consolidar' ? 'Consolidando…' : 'Consolidar ahora'}
          </button>
        </div>
      )}

      {enProgresoAll.length === 0 ? (
        <p className="dashboard-panel-empty">No hay tareas en progreso.</p>
      ) : enProgreso.length === 0 ? (
        <p className="dashboard-panel-empty">Ninguna tarea coincide con finca y tarea seleccionadas.</p>
      ) : (
        <ul className="en-progreso-list">
          {enProgreso.map(tarea => {
            const progress = computeTareaProgress(tarea)
            const expanded = expandedId === tarea.id
            const puedeCerrar = allCuadrosTareaFinalizados(tarea)
            const tipoLabel = tarea.tipo === 'manual' ? 'Manual' : 'Mecánica'
            const multiEjecutor = hasMultipleEjecutores(tarea)

            return (
              <li key={tarea.id} className="en-progreso-item">
                <button
                  type="button"
                  className="en-progreso-item-header"
                  onClick={() => setExpandedId(expanded ? null : tarea.id)}
                  aria-expanded={expanded}
                >
                  <div className="en-progreso-item-title">
                    <strong>{tarea.tarea}</strong>
                    <span className="en-progreso-meta">
                      {tarea.fincaNombre}
                      <span className={`en-progreso-badge en-progreso-badge--${tarea.tipo}`}>
                        {tipoLabel}
                      </span>
                      {multiEjecutor && (
                        <span className="en-progreso-badge en-progreso-badge--multi">Varios ejecutores</span>
                      )}
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`en-progreso-chevron${expanded ? ' en-progreso-chevron--open' : ''}`}
                  />
                </button>

                <p className="en-progreso-avance-hint">Avance general de la finca</p>

                <TaskProgressBar
                  value={progress.porcentaje}
                  label={formatProgressLabel(progress)}
                />

                {expanded && (
                  <div className="en-progreso-detail">
                    <EjecutorBreakdownSection tarea={tarea} partes={partes} />
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
                            .map((r) => (
                              <li key={`${r.fecha.seconds}-${r.operador}`}>
                                <strong>{r.operador}</strong> — {r.texto}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <div className="en-progreso-detail-actions">
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
                      <button
                        type="button"
                        className="btn-eliminar-tarea"
                        disabled={busyKey !== null}
                        onClick={() => confirmarEliminar(tarea)}
                      >
                        <Trash2 size={14} />
                        {busyKey === `delete:${tarea.id}` ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </div>
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
                      {tarea.fincaNombre} · {tarea.tipo === 'manual' ? 'Manual' : 'Mecánica'}
                    </span>
                  </div>
                  <div className="en-progreso-cerrada-actions">
                    <button
                      type="button"
                      className="btn-reabrir-tarea"
                      disabled={busyKey !== null}
                      onClick={() => runAction(key, () => onReabrirTarea(tarea.id))}
                    >
                      <RotateCcw size={14} />
                      {busyKey === key ? 'Reabriendo…' : 'Reabrir tarea'}
                    </button>
                    <button
                      type="button"
                      className="btn-eliminar-tarea"
                      disabled={busyKey !== null}
                      onClick={() => confirmarEliminar(tarea)}
                    >
                      <Trash2 size={14} />
                      {busyKey === `delete:${tarea.id}` ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
