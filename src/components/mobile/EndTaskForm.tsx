import { useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import type { RendimientoUnidad, Tarea } from '../../types'
import { RENDIMIENTO_UNIDADES } from '../../types'

interface Props {
  tarea: Tarea
  onSubmit: (
    cantidad: number,
    unidad: RendimientoUnidad,
    finalizarTarea: boolean,
  ) => Promise<void>
  onBack: () => void
}

export default function EndTaskForm({ tarea, onSubmit, onBack }: Props) {
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<RendimientoUnidad | ''>('')
  const [tareaTerminada, setTareaTerminada] = useState(false)
  const [saving, setSaving] = useState(false)

  const cantidadNum = Number(cantidad)
  const cantidadValida = cantidad.trim() !== '' && Number.isFinite(cantidadNum) && cantidadNum > 0
  const formValido = cantidadValida && unidad !== ''

  const handleSubmit = async () => {
    if (!formValido || saving) return
    setSaving(true)
    try {
      await onSubmit(cantidadNum, unidad as RendimientoUnidad, tareaTerminada)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container slide-up">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack} disabled={saving}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Cierre del día</h1>
        <p>Cerrar parte de labores con el rendimiento del día</p>
      </div>

      <div className="card">
        <div className="card-title">Resumen de la tarea</div>

        <div className="task-summary">
          <div className="task-summary-row">
            <span className="label">Tarea</span>
            <span className="value">{tarea.tarea}</span>
          </div>
          <div className="task-summary-row">
            <span className="label">Tipo</span>
            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
              {tarea.tipo}
            </span>
          </div>
          {tarea.tipo === 'manual' ? (
            <>
              <div className="task-summary-row">
                <span className="label">Cuadrilla</span>
                <span className="value">{tarea.cuadrilla}</span>
              </div>
              <div className="task-summary-row">
                <span className="label">Personas</span>
                <span className="value">{tarea.cantidadPersonas}</span>
              </div>
            </>
          ) : (
            <>
              <div className="task-summary-row">
                <span className="label">Operario</span>
                <span className="value">{tarea.persona}</span>
              </div>
              <div className="task-summary-row">
                <span className="label">Maquinaria</span>
                <span className="value">
                  {tarea.maquinariaModelo
                    ? `${tarea.maquinaria} (${tarea.maquinariaModelo})`
                    : tarea.maquinaria}
                </span>
              </div>
            </>
          )}
          <div className="task-summary-row">
            <span className="label">Cuadros</span>
            <span className="value">{(tarea.cuadros ?? []).join(', ') || '—'}</span>
          </div>
          <div className="task-summary-row">
            <span className="label">Finca</span>
            <span className="value">{tarea.fincaNombre}</span>
          </div>
        </div>
      </div>

      {tarea.rendimientosDiarios && tarea.rendimientosDiarios.length > 0 && (
        <div className="card">
          <div className="card-title">Registros anteriores</div>
          <ul className="rendimiento-history">
            {[...tarea.rendimientosDiarios].reverse().slice(0, 3).map((r) => (
              <li key={`${r.fecha.seconds}-${r.operador}`}>{r.texto}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="card-title">Rendimiento del día</div>
        <div className="rendimiento-fields">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              className="form-input"
              placeholder="Ej: 12"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Unidad</label>
            <select
              className="form-input"
              value={unidad}
              onChange={e => setUnidad(e.target.value as RendimientoUnidad | '')}
              disabled={saving}
            >
              <option value="" disabled>
                Elegir…
              </option>
              {RENDIMIENTO_UNIDADES.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <label className="end-task-finalizar">
        <input
          type="checkbox"
          checked={tareaTerminada}
          onChange={e => setTareaTerminada(e.target.checked)}
          disabled={saving}
        />
        <span>
          <strong>La tarea quedó terminada</strong>
          <small>
            {tareaTerminada
              ? 'Se guardará el parte y la tarea no volverá a aparecer en la app.'
              : 'Si el trabajo sigue mañana, dejalo desmarcado para cerrar solo el día.'}
          </small>
        </span>
      </label>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!formValido || saving}
        style={{ opacity: formValido && !saving ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving
          ? 'Guardando...'
          : tareaTerminada
            ? 'Cerrar parte y terminar tarea'
            : 'Cerrar parte de labores'}
      </button>
    </div>
  )
}
