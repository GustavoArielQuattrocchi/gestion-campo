import { useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import type { Tarea } from '../../types'

interface Props {
  tarea: Tarea
  onSubmit: (rendimiento: string) => Promise<void>
  onBack: () => void
}

export default function EndTaskForm({ tarea, onSubmit, onBack }: Props) {
  const [rendimiento, setRendimiento] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!rendimiento.trim() || saving) return
    setSaving(true)
    try {
      await onSubmit(rendimiento)
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
        <p>Registrar rendimiento diario</p>
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
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: 500 kg cosechados, 3 hectáreas fumigadas..."
            value={rendimiento}
            onChange={e => setRendimiento(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!rendimiento.trim() || saving}
        style={{ opacity: rendimiento.trim() && !saving ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving ? 'Guardando...' : 'Registrar rendimiento'}
      </button>
    </div>
  )
}
