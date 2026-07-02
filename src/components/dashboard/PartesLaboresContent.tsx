import { useMemo, useState } from 'react'
import { Users, Cog, Pencil, Trash2, Check, X } from 'lucide-react'
import type { ParteDeLabores, RendimientoUnidad } from '../../types'
import { RENDIMIENTO_UNIDADES } from '../../types'
import { formatTimestamp } from '../../utils/formatTimestamp'
import { deleteParte, updateParteRendimiento } from '../../utils/partesLaboresMutations'

interface Props {
  partes: ParteDeLabores[]
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

export default function PartesLaboresContent({
  partes,
  loading,
  error,
  parseWarning,
  fincasDisponibles,
  filtroFinca,
  filtroOperador,
  onFiltroFincaChange,
  onFiltroOperadorChange,
}: Props) {
  const operadoresDisponibles = useMemo(() => {
    const set = new Set(partes.map(p => p.operador))
    return [...set].sort()
  }, [partes])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCantidad, setEditCantidad] = useState('')
  const [editUnidad, setEditUnidad] = useState<RendimientoUnidad | ''>('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const partesFiltradas = useMemo(() => {
    return partes.filter(p => {
      if (filtroFinca !== 'todas' && p.fincaNombre !== filtroFinca) return false
      if (filtroOperador !== 'todos' && p.operador !== filtroOperador) return false
      return true
    })
  }, [partes, filtroFinca, filtroOperador])

  if (loading) {
    return <p className="dashboard-panel-empty">Cargando partes de labores...</p>
  }

  if (error) {
    return <p className="dashboard-panel-empty dashboard-panel-empty--error">{error}</p>
  }

  return (
    <>
      {parseWarning && (
        <p className="dashboard-panel-warning">{parseWarning}</p>
      )}

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
            ? 'Aún no hay partes de labores cerrados desde campo.'
            : 'Ningún parte coincide con los filtros seleccionados.'}
        </p>
      ) : (
        <ul className="partes-labores-list">
          {partesFiltradas.map(parte => (
            <li key={parte.id} className="parte-labores-item">
              <div className="parte-labores-item-header">
                <div>
                  <strong>{parte.tarea}</strong>
                  <span className="parte-labores-meta">
                    {parte.fincaNombre} · {formatTimestamp(parte.cerradoEn, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <span
                  className={`badge ${parte.tipo === 'manual' ? 'badge-green' : 'badge-blue'}`}
                >
                  {parte.tipo === 'manual' ? (
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
              <p className="parte-labores-detalle">{resumenParte(parte)}</p>
              <p className="parte-labores-cuadros">
                Cuadros: {(parte.cuadros ?? []).join(', ') || '—'}
              </p>

              {editingId === parte.id ? (
                <div className="parte-labores-edit">
                  <div className="parte-labores-edit-fields">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      placeholder="Cantidad"
                      value={editCantidad}
                      onChange={e => setEditCantidad(e.target.value)}
                      disabled={busyId === parte.id}
                    />
                    <select
                      className="form-input"
                      value={editUnidad}
                      onChange={e => setEditUnidad(e.target.value as RendimientoUnidad | '')}
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
                      onClick={() => saveEdit(parte)}
                      disabled={!editValido || busyId === parte.id}
                      title="Guardar"
                    >
                      <Check size={16} /> Guardar
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={cancelEdit}
                      disabled={busyId === parte.id}
                      title="Cancelar"
                    >
                      <X size={16} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="parte-labores-footer">
                  <p className="parte-labores-rendimiento">
                    <span>Rendimiento:</span> {parte.rendimiento}
                  </p>
                  <div className="parte-labores-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => startEdit(parte)}
                      disabled={busyId === parte.id}
                      title="Editar rendimiento"
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      onClick={() => confirmDelete(parte)}
                      disabled={busyId === parte.id}
                      title="Eliminar parte"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
