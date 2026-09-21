import { useState, useMemo } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import { cuadrillas, tareasManuales } from '../../data/catalog'
import { emptyCuadroSelection, type CuadroSelection, type ParteDeLabores, type Tarea } from '../../types'
import { ALCANCE_FINCA } from '../../utils/tareaAlcance'
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
import {
  ejecutorKeyFromTareaOrOverride,
  findParteVencidoParaEjecutor,
} from '../../utils/parteEstado'
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
    alcance?: 'finca'
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
  const [todaLaFinca, setTodaLaFinca] = useState(false)
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
    () => findTareaContinuableManual(tareasActivas, tarea, undefined, todaLaFinca ? ALCANCE_FINCA : 'cuadros'),
    [tareasActivas, tarea, todaLaFinca],
  )

  const responsableOk = normalizeResponsable(responsable).length > 0
  const parteVencidoEjecutor = useMemo(() => {
    if (!tareaContinuable || !cuadrilla || !responsableOk) return undefined
    const key = ejecutorKeyFromTareaOrOverride(tareaContinuable, {
      cuadrilla,
      responsable: normalizeResponsable(responsable),
    })
    return findParteVencidoParaEjecutor(partesAbiertos, tareaContinuable.id, key)
  }, [tareaContinuable, cuadrilla, responsableOk, responsable, partesAbiertos])

  const isValid =
    Boolean(cuadrilla && tarea && cantidadPersonas && responsableOk && (todaLaFinca || cuadroSelection.cuadroIds.length > 0))

  const handleSubmit = async () => {
    if (!isValid || saving || !origen) return
    const n = parseInt(cantidadPersonas, 10)
    if (!Number.isFinite(n) || n < 1) return
    const resp = normalizeResponsable(responsable)

    setSaving(true)
    try {
      rememberSugerenciaResponsable(operadorNombre, origen, resp)
      if (tareaContinuable) {
        await onContinue(
          tareaContinuable.id,
          todaLaFinca ? [] : cuadroSelection.cuadros,
          todaLaFinca ? [] : cuadroSelection.cuadroIds,
          {
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
          cuadros: todaLaFinca ? [] : cuadroSelection.cuadros,
          cuadroIds: todaLaFinca ? [] : cuadroSelection.cuadroIds,
          responsable: resp,
          ...(todaLaFinca ? { alcance: ALCANCE_FINCA } : {}),
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
          <label className={`checkbox-item ${todaLaFinca ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={todaLaFinca}
              onChange={e => {
                const next = e.target.checked
                setTodaLaFinca(next)
                if (next) setCuadroSelection(emptyCuadroSelection())
              }}
            />
            <span>Toda la finca</span>
          </label>
          {todaLaFinca ? (
            <p className="form-hint">Se guarda en la finca, sin asignar cuadros ni pintar el mapa.</p>
          ) : null}
        </div>

        {!todaLaFinca && (
        <div className="form-group">
          <label className="form-label">Cuadros de trabajo</label>
          <CuadroSelector
            fincaNombre={fincaNombre}
            seleccionadosIds={cuadroSelection.cuadroIds}
            onChange={setCuadroSelection}
          />
        </div>
        )}
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
        disabled={!isValid || saving || !!parteVencidoEjecutor}
        style={{ opacity: isValid && !saving && !parteVencidoEjecutor ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving
          ? 'Guardando...'
          : parteVencidoEjecutor
            ? 'Cerrá el parte anterior primero'
            : tareaContinuable
            ? todaLaFinca
              ? 'Abrir parte en tarea de toda la finca'
              : 'Agregar cuadros a tarea existente'
            : 'Abrir parte de labores'}
      </button>
    </div>
  )
}
