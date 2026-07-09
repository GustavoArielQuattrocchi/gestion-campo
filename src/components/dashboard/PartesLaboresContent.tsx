import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Cog, Pencil, Trash2, Check, X, Clock, History, AlertTriangle } from 'lucide-react'
import type { ParteDeLabores, RendimientoUnidad, Tarea } from '../../types'
import { RENDIMIENTO_UNIDADES } from '../../types'
import { formatTimestamp } from '../../utils/formatTimestamp'
import { deleteParte, updateParteRendimiento } from '../../utils/partesLaboresMutations'
import { groupPartesForDashboard, historicoPorDia, isParteAbiertoVencido, formatParteAbiertoDia } from '../../utils/parteEstado'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import TaskProgressBar from './TaskProgressBar'
import ParteWeather from './ParteWeather'

interface Props {
  partes: ParteDeLabores[]
  tareas: Tarea[]
  loading: boolean
  error: string | null
  parseWarning: string | null
  fincasDisponibles: string[]
  filtroFinca: string
  filtroOperador: string
  onFiltroFincaChange: (value: string) => void
  onFiltroOperadorChange: (value: string) => void
}

function resumenParte(parte: ParteDeLabores): string {
  if (parte.tipo === 'manual') {
    return `${parte.cuadrilla} · ${parte.cantidadPersonas} pers.`
  }
  if (parte.maquinariaModelo) {
    return `${parte.maquinaria} (${parte.maquinariaModelo})`
  }
  return `${parte.persona} · ${parte.maquinaria}`
}

function ParteCard({
  parte,
  tarea,
  editingId,
  editCantidad,
  editUnidad,
  busyId,
  editValido,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditCantidad,
  onEditUnidad,
}: {
  parte: ParteDeLabores
  tarea?: Tarea
  editingId: string | null
  editCantidad: string
  editUnidad: RendimientoUnidad | ''
  busyId: string | null
  editValido: boolean
  onStartEdit: (parte: ParteDeLabores) => void
  onCancelEdit: () => void
  onSaveEdit: (parte: ParteDeLabores) => void
  onDelete: (parte: ParteDeLabores) => void
  onEditCantidad: (value: string) => void
  onEditUnidad: (value: RendimientoUnidad | '') => void
}) {
  const progress = tarea ? computeTareaProgress(tarea) : null
  const abierto = parte.estado === 'abierto'
  const vencido = abierto && isParteAbiertoVencido(parte)

  return (
    <li className={`parte-labores-item ${abierto ? (vencido ? 'parte-labores-item--vencido' : 'parte-labores-item--abierto') : ''}`}>
      <div className="parte-labores-item-header">
        <div>
          <strong>{parte.tarea}</strong>
          <span className="parte-labores-meta">
            {parte.fincaNombre}
            {abierto
              ? ` · Abierto ${formatTimestamp(parte.abiertoEn, 'dd/MM/yyyy HH:mm')}`
              : parte.cerradoEn
                ? ` · Cerrado ${formatTimestamp(parte.cerradoEn, 'dd/MM/yyyy HH:mm')}`
                : ''}
          </span>
        </div>
        <span className={`badge ${vencido ? 'badge-red' : abierto ? 'badge-orange' : parte.tipo === 'manual' ? 'badge-green' : 'badge-blue'}`}>
          {vencido ? (
            <>
              <AlertTriangle size={10} /> Pendiente
            </>
          ) : abierto ? (
            <>
              <Clock size={10} /> En ejecución
            </>
          ) : parte.tipo === 'manual' ? (
            <>
              <Users size={10} /> Manual
            </>
          ) : (
            <>
              <Cog size={10} /> Mec.
            </>
          )}
        </span>
      </div>
      <p className="parte-labores-operador">
        Operador: <strong>{parte.operador}</strong>
      </p>
      {vencido && (
        <p className="parte-labores-vencido-note">
          Abierto el {formatParteAbiertoDia(parte)} — sin cierre de jornada
        </p>
      )}
      <p className="parte-labores-detalle">{resumenParte(parte)}</p>
      <p className="parte-labores-cuadros">
        Cuadros: {(parte.cuadros ?? []).join(', ') || '—'}
      </p>

      <ParteWeather parte={parte} />

      {progress && (
        <div className="parte-labores-progress">
          <span className="parte-labores-progress-label">Avance de tarea</span>
          <TaskProgressBar value={progress.porcentaje} label={formatProgressLabel(progress)} />
        </div>
      )}

      {!abierto && editingId === parte.id ? (
        <div className="parte-labores-edit">
          <div className="parte-labores-edit-fields">
            <input
              type="number"
              min="0"
              step="any"
              className="form-input"
              placeholder="Cantidad"
              value={editCantidad}
              onChange={e => onEditCantidad(e.target.value)}
              disabled={busyId === parte.id}
            />
            <select
              className="form-input"
              value={editUnidad}
              onChange={e => onEditUnidad(e.target.value as RendimientoUnidad | '')}
              disabled={busyId === parte.id}
            >
              <option value="" disabled>
                Unidad…
              </option>
              {RENDIMIENTO_UNIDADES.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="parte-labores-edit-actions">
            <button
              type="button"
              className="btn-icon btn-icon--confirm"
              onClick={() => onSaveEdit(parte)}
              disabled={!editValido || busyId === parte.id}
              title="Guardar"
            >
              <Check size={16} /> Guardar
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onCancelEdit}
              disabled={busyId === parte.id}
              title="Cancelar"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="parte-labores-footer">
          {parte.rendimiento ? (
            <p className="parte-labores-rendimiento">
              <span>Rendimiento:</span> {parte.rendimiento}
            </p>
          ) : (
            <p className="parte-labores-rendimiento parte-labores-rendimiento--pending">
              Pendiente de cierre con rendimiento desde campo
            </p>
          )}
          {!abierto && (
            <div className="parte-labores-actions">
              <button
                type="button"
                className="btn-icon"
                onClick={() => onStartEdit(parte)}
                disabled={busyId === parte.id}
                title="Editar rendimiento"
              >
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                onClick={() => onDelete(parte)}
                disabled={busyId === parte.id}
                title="Eliminar parte"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function PartesLaboresContent({
  partes,
  tareas,
  loading,
  error,
  parseWarning,
  fincasDisponibles,
  filtroFinca,
  filtroOperador,
  onFiltroFincaChange,
  onFiltroOperadorChange,
}: Props) {
  const tareasById = useMemo(() => new Map(tareas.map(t => [t.id, t])), [tareas])

  const operadoresDisponibles = useMemo(() => {
    const set = new Set(partes.map(p => p.operador))
    return [...set].sort()
  }, [partes])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCantidad, setEditCantidad] = useState('')
  const [editUnidad, setEditUnidad] = useState<RendimientoUnidad | ''>('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const partesFiltradas = useMemo(() => {
    return partes.filter(p => {
      if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
      if (filtroOperador !== 'todos' && p.operador !== filtroOperador) return false
      return true
    })
  }, [partes, filtroFinca, filtroOperador])

  const { enEjecucionHoy, enEjecucionVencidos, cerradosHoy, historico } = useMemo(
    () => groupPartesForDashboard(partesFiltradas),
    [partesFiltradas],
  )

  const historicoAgrupado = useMemo(() => historicoPorDia(historico), [historico])

  const startEdit = (parte: ParteDeLabores) => {
    setActionError(null)
    setEditingId(parte.id)
    setEditCantidad(
      typeof parte.rendimientoCantidad === 'number' ? String(parte.rendimientoCantidad) : '',
    )
    setEditUnidad(parte.rendimientoUnidad ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditCantidad('')
    setEditUnidad('')
  }

  const cantidadNum = Number(editCantidad)
  const editValido =
    editCantidad.trim() !== '' &&
    Number.isFinite(cantidadNum) &&
    cantidadNum > 0 &&
    editUnidad !== ''

  const saveEdit = async (parte: ParteDeLabores) => {
    if (!editValido || busyId) return
    setBusyId(parte.id)
    setActionError(null)
    try {
      await updateParteRendimiento(parte, cantidadNum, editUnidad as RendimientoUnidad)
      cancelEdit()
    } catch (err) {
      console.error('Error al editar parte de labores:', err)
      setActionError('No se pudo guardar el cambio. Revisá la conexión y las reglas de Firestore.')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async (parte: ParteDeLabores) => {
    if (busyId) return
    const ok = window.confirm(
      `¿Eliminar el parte de "${parte.tarea}" (${parte.operador})? Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    setBusyId(parte.id)
    setActionError(null)
    try {
      await deleteParte(parte)
      if (editingId === parte.id) cancelEdit()
    } catch (err) {
      console.error('Error al eliminar parte de labores:', err)
      setActionError('No se pudo eliminar el parte. Revisá la conexión y las reglas de Firestore.')
    } finally {
      setBusyId(null)
    }
  }

  const cardProps = {
    editingId,
    editCantidad,
    editUnidad,
    busyId,
    editValido,
    onStartEdit: startEdit,
    onCancelEdit: cancelEdit,
    onSaveEdit: saveEdit,
    onDelete: confirmDelete,
    onEditCantidad: setEditCantidad,
    onEditUnidad: setEditUnidad,
  }

  if (loading) {
    return <p className="dashboard-panel-empty">Cargando partes de labores...</p>
  }

  if (error) {
    return <p className="dashboard-panel-empty dashboard-panel-empty--error">{error}</p>
  }

  return (
    <>
      {parseWarning && <p className="dashboard-panel-warning">{parseWarning}</p>}
      {actionError && (
        <p className="dashboard-panel-empty dashboard-panel-empty--error">{actionError}</p>
      )}

      {partes.length > 0 && (
        <div className="partes-labores-filters">
          <label className="partes-labores-filter">
            <span>Finca</span>
            <select value={filtroFinca} onChange={e => onFiltroFincaChange(e.target.value)}>
              <option value="todas">Todas</option>
              {fincasDisponibles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="partes-labores-filter">
            <span>Operador</span>
            <select value={filtroOperador} onChange={e => onFiltroOperadorChange(e.target.value)}>
              <option value="todos">Todos</option>
              {operadoresDisponibles.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {partesFiltradas.length === 0 ? (
        <p className="dashboard-panel-empty">
          {partes.length === 0
            ? 'Aún no hay partes de labores registrados desde campo.'
            : 'Ningún parte coincide con los filtros seleccionados.'}
        </p>
      ) : (
        <>
          {enEjecucionVencidos.length > 0 && (
            <section className="partes-labores-section">
              <h3 className="partes-labores-section-title partes-labores-section-title--warn">
                <AlertTriangle size={16} /> Pendientes de días anteriores ({enEjecucionVencidos.length})
              </h3>
              <ul className="partes-labores-list">
                {enEjecucionVencidos.map(parte => (
                  <ParteCard
                    key={parte.id}
                    parte={parte}
                    tarea={tareasById.get(parte.tareaId)}
                    {...cardProps}
                  />
                ))}
              </ul>
            </section>
          )}

          {enEjecucionHoy.length > 0 && (
            <section className="partes-labores-section">
              <h3 className="partes-labores-section-title">
                <Clock size={16} /> En ejecución hoy ({enEjecucionHoy.length})
              </h3>
              <ul className="partes-labores-list">
                {enEjecucionHoy.map(parte => (
                  <ParteCard
                    key={parte.id}
                    parte={parte}
                    tarea={tareasById.get(parte.tareaId)}
                    {...cardProps}
                  />
                ))}
              </ul>
            </section>
          )}

          {cerradosHoy.length > 0 && (
            <section className="partes-labores-section">
              <h3 className="partes-labores-section-title">
                Cerrados hoy ({cerradosHoy.length})
              </h3>
              <ul className="partes-labores-list">
                {cerradosHoy.map(parte => (
                  <ParteCard
                    key={parte.id}
                    parte={parte}
                    tarea={tareasById.get(parte.tareaId)}
                    {...cardProps}
                  />
                ))}
              </ul>
            </section>
          )}

          {historico.length > 0 && (
            <section className="partes-labores-section">
              <h3 className="partes-labores-section-title">
                <History size={16} /> Días anteriores ({historico.length})
              </h3>
              {[...historicoAgrupado.entries()].map(([dia, items]) => (
                <div key={dia} className="partes-labores-dia-grupo">
                  <h4 className="partes-labores-dia-titulo">
                    {format(new Date(`${dia}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                  </h4>
                  <ul className="partes-labores-list">
                    {items.map(parte => (
                      <ParteCard
                        key={parte.id}
                        parte={parte}
                        tarea={tareasById.get(parte.tareaId)}
                        {...cardProps}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  )
}
