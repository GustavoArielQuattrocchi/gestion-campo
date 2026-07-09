import { useState, useMemo } from 'react'
import { ChevronLeft, Save, RefreshCw } from 'lucide-react'
import { cuadrillas, tareasManuales } from '../../data/catalog'
import { emptyCuadroSelection, type CuadroSelection, type Tarea } from '../../types'
import { findTareaContinuableManual } from '../../utils/findTareaContinuable'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import CuadroSelector from './CuadroSelector'

interface Props {
  fincaNombre: string
  tareasActivas: Tarea[]
  onSubmit: (data: {
    cuadrilla: string
    tarea: string
    cantidadPersonas: number
    cuadros: string[]
    cuadroIds: string[]
  }) => Promise<boolean>
  onContinue: (tareaId: string, cuadros: string[], cuadroIds: string[], cantidadPersonas?: number) => Promise<boolean>
  onBack: () => void
}

export default function ManualTaskForm({ fincaNombre, tareasActivas, onSubmit, onContinue, onBack }: Props) {
  const [cuadrilla, setCuadrilla] = useState('')
  const [tarea, setTarea] = useState('')
  const [cantidadPersonas, setCantidadPersonas] = useState('')
  const [cuadroSelection, setCuadroSelection] = useState<CuadroSelection>(emptyCuadroSelection)
  const [saving, setSaving] = useState(false)

  const tareaContinuable = useMemo(
    () => findTareaContinuableManual(tareasActivas, tarea, cuadrilla),
    [tareasActivas, tarea, cuadrilla],
  )

  const isValid = cuadrilla && tarea && cantidadPersonas && cuadroSelection.cuadroIds.length > 0

  const handleSubmit = async () => {
    if (!isValid || saving) return
    const n = parseInt(cantidadPersonas, 10)
    if (!Number.isFinite(n) || n < 1) return

    setSaving(true)
    try {
      if (tareaContinuable) {
        await onContinue(tareaContinuable.id, cuadroSelection.cuadros, cuadroSelection.cuadroIds, n)
      } else {
        await onSubmit({
          cuadrilla,
          tarea,
          cantidadPersonas: n,
          cuadros: cuadroSelection.cuadros,
          cuadroIds: cuadroSelection.cuadroIds,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container slide-up">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Tarea Manual</h1>
        <p>{fincaNombre}</p>
      </div>

      <div className="card">
        <div className="card-title">Datos de la tarea</div>

        <div className="form-group">
          <label className="form-label">Cuadrilla</label>
          <select
            className="form-select"
            value={cuadrilla}
            onChange={e => setCuadrilla(e.target.value)}
          >
            <option value="">Seleccionar cuadrilla...</option>
            {cuadrillas.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tarea a realizar</label>
          <select
            className="form-select"
            value={tarea}
            onChange={e => setTarea(e.target.value)}
          >
            <option value="">Seleccionar tarea...</option>
            {tareasManuales.map(t => (
              <option key={t.id} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cantidad de personas</label>
          <input
            type="number"
            className="form-input"
            placeholder="Ej: 8"
            min="1"
            value={cantidadPersonas}
            onChange={e => setCantidadPersonas(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cuadros de trabajo</label>
          <CuadroSelector
            fincaNombre={fincaNombre}
            seleccionadosIds={cuadroSelection.cuadroIds}
            onChange={setCuadroSelection}
          />
        </div>
      </div>

      {tareaContinuable && (() => {
        const progress = computeTareaProgress(tareaContinuable)
        return (
          <div className="card continue-task-banner">
            <RefreshCw size={16} />
            <div>
              <strong>Ya existe esta tarea en progreso</strong>
              <small>
                {formatProgressLabel(progress)} · {(tareaContinuable.cuadros ?? []).join(', ')}
              </small>
              <small>Los cuadros nuevos se agregarán a la tarea existente.</small>
            </div>
          </div>
        )
      })()}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!isValid || saving}
        style={{ opacity: isValid && !saving ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving
          ? 'Guardando...'
          : tareaContinuable
            ? 'Agregar cuadros a tarea existente'
            : 'Iniciar Tarea'}
      </button>
    </div>
  )
}
