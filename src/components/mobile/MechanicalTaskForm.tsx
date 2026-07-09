import { useState, useMemo } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import { getMaquinariasPorFinca, tareasMecanicas } from '../../data/catalog'
import { emptyCuadroSelection, type CuadroSelection, type ParteDeLabores, type Tarea } from '../../types'
import { findTareaContinuableMecanica } from '../../utils/findTareaContinuable'
import CuadroSelector from './CuadroSelector'
import ContinueTaskBanner from './ContinueTaskBanner'

interface Props {
  fincaId: string
  fincaNombre: string
  tareasActivas: Tarea[]
  partesAbiertos: ParteDeLabores[]
  onSubmit: (data: {
    tarea: string
    persona: string
    maquinaria: string
    maquinariaModelo?: string
    maquinariaId?: string
    cuadros: string[]
    cuadroIds: string[]
    ordenCuraRef?: string
  }) => Promise<boolean>
  onContinue: (tareaId: string, cuadros: string[], cuadroIds: string[]) => Promise<boolean>
  onBack: () => void
}

export default function MechanicalTaskForm({ fincaId, fincaNombre, tareasActivas, partesAbiertos, onSubmit, onContinue, onBack }: Props) {
  const [tarea, setTarea] = useState('')
  const [persona, setPersona] = useState('')
  const [maquinariaId, setMaquinariaId] = useState('')
  const [cuadroSelection, setCuadroSelection] = useState<CuadroSelection>(emptyCuadroSelection)
  const [ordenCuraRef, setOrdenCuraRef] = useState('')
  const [saving, setSaving] = useState(false)

  const maquinariasFinca = useMemo(() => getMaquinariasPorFinca(fincaId), [fincaId])

  const tareaContinuable = useMemo(
    () => findTareaContinuableMecanica(tareasActivas, tarea, persona),
    [tareasActivas, tarea, persona],
  )

  const isValid = tarea && persona && maquinariaId && cuadroSelection.cuadroIds.length > 0

  const handleSubmit = async () => {
    if (!isValid || saving) return
    const tractor = maquinariasFinca.find(m => m.id === maquinariaId)
    if (!tractor) return

    setSaving(true)
    try {
      if (tareaContinuable) {
        await onContinue(tareaContinuable.id, cuadroSelection.cuadros, cuadroSelection.cuadroIds)
      } else {
        await onSubmit({
          tarea,
          persona,
          maquinaria: tractor.nombre,
          maquinariaModelo: tractor.modelo,
          maquinariaId: tractor.id,
          cuadros: cuadroSelection.cuadros,
          cuadroIds: cuadroSelection.cuadroIds,
          ...(ordenCuraRef.trim() ? { ordenCuraRef: ordenCuraRef.trim() } : {}),
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
        <h1>Tarea Mecánica</h1>
        <p>{fincaNombre}</p>
      </div>

      <div className="card">
        <div className="card-title">Datos de la tarea</div>

        <div className="form-group">
          <label className="form-label">Tarea a realizar</label>
          <select
            className="form-select"
            value={tarea}
            onChange={e => setTarea(e.target.value)}
          >
            <option value="">Seleccionar tarea...</option>
            {tareasMecanicas.map(t => (
              <option key={t.id} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Persona que realiza</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nombre del operario"
            value={persona}
            onChange={e => setPersona(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Maquinaria utilizada</label>
          <select
            className="form-select"
            value={maquinariaId}
            onChange={e => setMaquinariaId(e.target.value)}
            disabled={maquinariasFinca.length === 0}
          >
            <option value="">
              {maquinariasFinca.length === 0
                ? 'Sin tractores cargados para esta finca'
                : 'Seleccionar maquinaria...'}
            </option>
            {maquinariasFinca.map(m => (
              <option key={m.id} value={m.id}>
                {m.nombre} — {m.modelo}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cuadros de trabajo</label>
          <CuadroSelector
            fincaNombre={fincaNombre}
            seleccionadosIds={cuadroSelection.cuadroIds}
            onChange={setCuadroSelection}
          />
        </div>

        {tarea === 'Curacion' && (
          <div className="form-group">
            <label className="form-label">Orden de cura (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: OC-FOA-2026-001"
              value={ordenCuraRef}
              onChange={e => setOrdenCuraRef(e.target.value)}
            />
          </div>
        )}
      </div>

      {tareaContinuable && (
        <ContinueTaskBanner tarea={tareaContinuable} partesAbiertos={partesAbiertos} />
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
