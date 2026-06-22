import { useState, useCallback, useMemo } from 'react'
import { ChevronLeft, Save, CheckCircle } from 'lucide-react'
import { getMaquinariasPorFinca, tareasMecanicas } from '../../data/catalog'
import { emptyCuadroSelection, type CuadroSelection } from '../../types'
import CuadroSelector from './CuadroSelector'

interface Props {
  fincaId: string
  fincaNombre: string
  onSubmit: (data: {
    tarea: string
    persona: string
    maquinaria: string
    maquinariaModelo?: string
    maquinariaId?: string
    cuadros: string[]
    cuadroIds: string[]
  }) => Promise<boolean>
  onBack: () => void
}

export default function MechanicalTaskForm({ fincaId, fincaNombre, onSubmit, onBack }: Props) {
  const [tarea, setTarea] = useState('')
  const [persona, setPersona] = useState('')
  const [maquinariaId, setMaquinariaId] = useState('')
  const [cuadroSelection, setCuadroSelection] = useState<CuadroSelection>(emptyCuadroSelection)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; detail: string } | null>(null)

  const maquinariasFinca = useMemo(() => getMaquinariasPorFinca(fincaId), [fincaId])

  const resetForm = useCallback(() => {
    setTarea('')
    setPersona('')
    setMaquinariaId('')
    setCuadroSelection(emptyCuadroSelection())
  }, [])

  const isValid = tarea && persona && maquinariaId && cuadroSelection.cuadroIds.length > 0

  const handleSubmit = async () => {
    if (!isValid || saving) return
    const tractor = maquinariasFinca.find(m => m.id === maquinariaId)
    if (!tractor) return

    setSaving(true)
    try {
      const ok = await onSubmit({
        tarea,
        persona,
        maquinaria: tractor.nombre,
        maquinariaModelo: tractor.modelo,
        maquinariaId: tractor.id,
        cuadros: cuadroSelection.cuadros,
        cuadroIds: cuadroSelection.cuadroIds,
      })
      if (ok) {
        const detail = `${tarea} — ${persona} con ${tractor.nombre} (${tractor.modelo})`
        setToast({ message: 'Tarea cargada correctamente', detail })
        resetForm()
        setTimeout(() => setToast(null), 3500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container slide-up">
      {toast && (
        <div className="success-toast">
          <div className="success-toast-inner">
            <div className="success-toast-icon">
              <CheckCircle size={20} />
            </div>
            <div className="success-toast-text">
              <strong>{toast.message}</strong>
              <span>{toast.detail}</span>
            </div>
          </div>
        </div>
      )}

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
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!isValid || saving}
        style={{ opacity: isValid && !saving ? 1 : 0.5, marginBottom: 24 }}
      >
        <Save size={18} />
        {saving ? 'Guardando...' : 'Iniciar Tarea'}
      </button>
    </div>
  )
}
