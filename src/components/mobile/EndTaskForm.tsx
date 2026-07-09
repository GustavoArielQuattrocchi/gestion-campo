import { useState, useMemo } from 'react'
import { ChevronLeft, Save, History } from 'lucide-react'
import type { ParteDeLabores, RendimientoUnidad, Tarea } from '../../types'
import { RENDIMIENTO_UNIDADES } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import { getDefaultUnit } from '../../data/laborUnits'
import { formatParteAbiertoDia, isParteAbiertoVencido } from '../../utils/parteEstado'

interface Props {
  tarea: Tarea
  parteAbierto: ParteDeLabores
  onSubmit: (
    cantidad: number,
    unidad: RendimientoUnidad,
    extras: {
      horaInicio?: string
      horaFin?: string
      observaciones?: string
    },
  ) => Promise<void>
  onBack: () => void
}

export default function EndTaskForm({ tarea, parteAbierto, onSubmit, onBack }: Props) {
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<RendimientoUnidad | ''>(() => getDefaultUnit(tarea.tarea) || '')
  const [saving, setSaving] = useState(false)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const progress = useMemo(() => computeTareaProgress(tarea), [tarea])
  const esVencido = useMemo(() => isParteAbiertoVencido(parteAbierto), [parteAbierto])

  const cantidadNum = Number(cantidad)
  const cantidadValida = cantidad.trim() !== '' && Number.isFinite(cantidadNum) && cantidadNum > 0
  const formValido = cantidadValida && unidad !== ''

  const handleSubmit = async () => {
    if (!formValido || saving) return
    setSaving(true)
    try {
      const extras: { horaInicio?: string; horaFin?: string; observaciones?: string } = {}
      if (horaInicio) extras.horaInicio = horaInicio
      if (horaFin) extras.horaFin = horaFin
      if (observaciones.trim()) extras.observaciones = observaciones.trim()
      await onSubmit(cantidadNum, unidad as RendimientoUnidad, extras)
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
        <h1>{esVencido ? 'Cierre pendiente' : 'Cierre del día'}</h1>
        <p>
          {esVencido
            ? 'Registrar rendimiento con la fecha del día en que se abrió el parte'
            : 'Registrar rendimiento y cerrar el parte de labores'}
        </p>
      </div>

      {esVencido && (
        <div className="card continue-task-banner continue-task-banner--warn">
          <History size={16} />
          <div>
            <strong>Cierre de jornada anterior</strong>
            <small>
              Este cierre quedará registrado el {formatParteAbiertoDia(parteAbierto)}, no con la fecha de hoy.
            </small>
          </div>
        </div>
      )}

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
          <div className="task-summary-row">
            <span className="label">Avance de tarea</span>
            <span className="value">{formatProgressLabel(progress)}</span>
          </div>
        </div>
      </div>

      {tarea.rendimientosDiarios && tarea.rendimientosDiarios.length > 0 && (
        <div className="card">
          <div className="card-title">Cierres anteriores</div>
          <ul className="rendimiento-history">
            {[...tarea.rendimientosDiarios].reverse().slice(0, 3).map((r) => (
              <li key={`${r.fecha.seconds}-${r.operador}`}>{r.texto}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="card-title">Horario de trabajo (opcional)</div>
        <div className="horario-fields">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hora inicio</label>
            <input
              type="time"
              className="form-input"
              value={horaInicio}
              onChange={e => setHoraInicio(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hora fin</label>
            <input
              type="time"
              className="form-input"
              value={horaFin}
              onChange={e => setHoraFin(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

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

      <div className="card">
        <div className="card-title">Observaciones (opcional)</div>
        <div className="observaciones-field">
          <textarea
            placeholder="Notas del día, estado del cuadro, problemas observados..."
            maxLength={500}
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            disabled={saving}
          />
          <div className="observaciones-counter">{observaciones.length}/500</div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!formValido || saving}
        style={{ opacity: formValido && !saving ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving ? 'Guardando...' : 'Cerrar parte de labores'}
      </button>
    </div>
  )
}
