import { useState, useMemo } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import { cuadrillas, tareasManuales } from '../../data/catalog'
import { emptyCuadroSelection, type CuadroSelection, type ParteDeLabores, type Tarea } from '../../types'
import { findTareaContinuableManual } from '../../utils/findTareaContinuable'
import type { ContinueTaskOptions } from '../../utils/tareaEjecutor'
import {
  labelResponsableCampo,
  normalizeResponsable,
  origenFromCuadrilla,
} from '../../utils/origenEjecucion'
import {
  loadSugerenciasResponsable,
  rememberSugerenciaResponsable,
} from '../../utils/mobileLocalMemory'
import CuadroSelector from './CuadroSelector'
import ContinueTaskBanner from './ContinueTaskBanner'
import AutocompleteTextField from './AutocompleteTextField'

interface Props {
  fincaNombre: string
  operadorNombre: string
  tareasActivas: Tarea[]
  partesAbiertos: ParteDeLabores[]
  onSubmit: (data: {
    cuadrilla: string
    tarea: string
    cantidadPersonas: number
    cuadros: string[]
    cuadroIds: string[]
    responsable: string
  }) => Promise<boolean>
  onContinue: (
    tareaId: string,
    cuadros: string[],
    cuadroIds: string[],
    options?: ContinueTaskOptions,
  ) => Promise<boolean>
  onBack: () => void
}

export default function ManualTaskForm({
  fincaNombre,
  operadorNombre,
  tareasActivas,
  partesAbiertos,
  onSubmit,
  onContinue,
  onBack,
}: Props) {
  const [cuadrilla, setCuadrilla] = useState('')
  const [tarea, setTarea] = useState('')
  const [cantidadPersonas, setCantidadPersonas] = useState('')
  const [responsable, setResponsable] = useState('')
  const [cuadroSelection, setCuadroSelection] = useState<CuadroSelection>(emptyCuadroSelection)
  const [saving, setSaving] = useState(false)

  const origen = useMemo(
    () => (cuadrilla ? origenFromCuadrilla(cuadrilla) : null),
    [cuadrilla],
  )

  const sugerencias = useMemo(() => {
    if (!origen || !operadorNombre.trim()) return []
    return loadSugerenciasResponsable(operadorNombre, origen)
  }, [origen, operadorNombre, responsable])

  const tareaContinuable = useMemo(
    () => findTareaContinuableManual(tareasActivas, tarea),
    [tareasActivas, tarea],
  )

  const responsableOk = normalizeResponsable(responsable).length > 0
  const isValid =
    Boolean(cuadrilla && tarea && cantidadPersonas && responsableOk && cuadroSelection.cuadroIds.length > 0)

  const handleSubmit = async () => {
    if (!isValid || saving || !origen) return
    const n = parseInt(cantidadPersonas, 10)
    if (!Number.isFinite(n) || n < 1) return
    const resp = normalizeResponsable(responsable)

    setSaving(true)
    try {
      rememberSugerenciaResponsable(operadorNombre, origen, resp)
      if (tareaContinuable) {
        await onContinue(tareaContinuable.id, cuadroSelection.cuadros, cuadroSelection.cuadroIds, {
          cantidadPersonas: n,
          cuadrilla,
          responsable: resp,
          origenEjecucion: origen,
        })
      } else {
        await onSubmit({
          cuadrilla,
          tarea,
          cantidadPersonas: n,
          cuadros: cuadroSelection.cuadros,
          cuadroIds: cuadroSelection.cuadroIds,
          responsable: resp,
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
            onChange={e => {
              setCuadrilla(e.target.value)
              setResponsable('')
            }}
          >
            <option value="">Seleccionar cuadrilla...</option>
            {cuadrillas.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {origen && (
          <AutocompleteTextField
            id="manual-responsable"
            label={labelResponsableCampo(origen)}
            value={responsable}
            suggestions={sugerencias}
            placeholder={
              origen === 'externa' ? 'Nombre de la empresa...' : 'Nombre del responsable...'
            }
            onChange={setResponsable}
          />
        )}

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

      {tareaContinuable && (
        <ContinueTaskBanner
          tarea={tareaContinuable}
          partesAbiertos={partesAbiertos}
          ejecutorActual={
            cuadrilla && responsableOk
              ? `${cuadrilla} · ${normalizeResponsable(responsable)}`
              : cuadrilla || undefined
          }
          ejecutorClave={cuadrilla || undefined}
          responsableClave={responsableOk ? normalizeResponsable(responsable) : undefined}
        />
      )}

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
            : 'Abrir parte de labores'}
      </button>
    </div>
  )
}
