import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Tarea } from '../../../types'
import { RENDIMIENTO_UNIDADES, type RendimientoUnidad } from '../../../types'
import { formatTareaMapLabel } from '../../../utils/vineyardMapLabels'
import type { MapRelevamientoActions } from '../useMapRelevamiento'

interface Props {
  open: boolean
  tarea: Tarea
  cuadroId: string
  cuadroNombre: string
  actions: MapRelevamientoActions
  onClose: () => void
  onSuccess: () => void
}

export default function FinalizarCuadroModal({
  open,
  tarea,
  cuadroId,
  cuadroNombre,
  actions,
  onClose,
  onSuccess,
}: Props) {
  const [incluirRendimiento, setIncluirRendimiento] = useState(false)
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<RendimientoUnidad>('jornal')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setIncluirRendimiento(false)
      setCantidad('')
      setUnidad('jornal')
    }
  }, [open])

  if (!open) return null

  const cantidadNum = parseFloat(cantidad)
  const rendimientoValido =
    !incluirRendimiento || (Number.isFinite(cantidadNum) && cantidadNum > 0 && unidad)

  const handleSubmit = async () => {
    if (!rendimientoValido || actions.busy) return

    const rendimiento = incluirRendimiento
      ? { cantidad: cantidadNum, unidad, cuadroId }
      : undefined

    const ok = await actions.finalizarCuadro(tarea.id, cuadroId, rendimiento)
    if (ok !== null) {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="metric-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="metric-modal map-relevamiento-modal map-relevamiento-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finalizar-cuadro-title"
        onClick={e => e.stopPropagation()}
        style={{ borderTopColor: '#16a34a' }}
      >
        <header className="metric-modal-header">
          <h2 id="finalizar-cuadro-title">Finalizar cuadro</h2>
          <button type="button" className="metric-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="metric-modal-body map-relevamiento-modal-body">
          <p className="map-relevamiento-finalizar-summary">
            <strong>{cuadroNombre}</strong> ({cuadroId}) en{' '}
            <strong>{formatTareaMapLabel(tarea)}</strong>
          </p>
          <p className="map-relevamiento-hint">
            El cuadro sumará al porcentaje de avance. La tarea seguirá en progreso hasta cerrarla
            manualmente.
          </p>

          <label className="map-relevamiento-checkbox">
            <input
              type="checkbox"
              checked={incluirRendimiento}
              onChange={e => setIncluirRendimiento(e.target.checked)}
            />
            Registrar rendimiento (opcional)
          </label>

          {incluirRendimiento && (
            <div className="map-relevamiento-rendimiento-fields">
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step="any"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unidad</label>
                <select
                  className="form-select"
                  value={unidad}
                  onChange={e => setUnidad(e.target.value as RendimientoUnidad)}
                >
                  {RENDIMIENTO_UNIDADES.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {actions.actionError && (
            <p className="map-relevamiento-error" role="alert">
              {actions.actionError}
            </p>
          )}

          <div className="map-relevamiento-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={actions.busy}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary map-relevamiento-btn-finalizar"
              disabled={!rendimientoValido || actions.busy}
              onClick={handleSubmit}
            >
              {actions.busy ? 'Guardando…' : 'Finalizar cuadro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
