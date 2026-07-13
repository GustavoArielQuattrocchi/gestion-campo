import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { cuadrillas, getMaquinariasPorFinca, tareasManuales, tareasMecanicas } from '../../../data/catalog'
import type { CuadroDetalle } from '../../../data/fincaData'
import type { Tarea, TareaTipo } from '../../../types'
import {
  findTareaContinuableManual,
  findTareaContinuableMecanica,
} from '../../../utils/findTareaContinuable'
import { formatTareaMapLabel } from '../../../utils/vineyardMapLabels'
import type { MapRelevamientoActions } from '../useMapRelevamiento'

interface Props {
  open: boolean
  cuadro: CuadroDetalle
  allTareas: Tarea[]
  actions: MapRelevamientoActions
  onClose: () => void
  onSuccess: (labor: string) => void
}

export default function AsignarLaborModal({
  open,
  cuadro,
  allTareas,
  actions,
  onClose,
  onSuccess,
}: Props) {
  const [tipo, setTipo] = useState<TareaTipo>('manual')
  const [tarea, setTarea] = useState('')
  const [cuadrilla, setCuadrilla] = useState('')
  const [cantidadPersonas, setCantidadPersonas] = useState('1')
  const [persona, setPersona] = useState('')
  const [maquinariaId, setMaquinariaId] = useState('')
  const [ordenCuraRef, setOrdenCuraRef] = useState('')

  const fincaId = cuadro.finca
  const fincaNombre = cuadro.finca
  const cuadroNombre = cuadro.nombre

  const tareasActivasFinca = useMemo(
    () => allTareas.filter(t => t.fincaId === fincaId && t.estado === 'en_progreso'),
    [allTareas, fincaId],
  )

  const maquinariasFinca = useMemo(() => getMaquinariasPorFinca(fincaId), [fincaId])

  const tareaContinuable = useMemo(() => {
    if (tipo === 'manual') {
      return findTareaContinuableManual(tareasActivasFinca, tarea)
    }
    return findTareaContinuableMecanica(tareasActivasFinca, tarea)
  }, [tipo, tareasActivasFinca, tarea])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isManualValid =
    tipo === 'manual' &&
    Boolean(cuadrilla && tarea && cantidadPersonas && parseInt(cantidadPersonas, 10) >= 1)

  const isMecanicaValid = tipo === 'mecanica' && Boolean(tarea && persona && maquinariaId)

  const isValid = tipo === 'manual' ? isManualValid : isMecanicaValid

  const handleSubmit = async () => {
    if (!isValid || actions.busy) return

    const cuadros = [cuadroNombre]
    const cuadroIds = [cuadro.id]
    const ctx = { fincaId, fincaNombre }

    if (tareaContinuable) {
      const label = `${tareaContinuable.tarea} — ${tareaContinuable.fincaNombre}`
      const ok = window.confirm(
        `Ya existe esta labor en progreso: ${label}.\n\n¿Agregar este cuadro a esa tarea?`,
      )
      if (!ok) return

      const result =
        tipo === 'manual'
          ? await actions.continuarTarea(tareaContinuable.id, cuadros, cuadroIds, {
              cantidadPersonas: parseInt(cantidadPersonas, 10),
              cuadrilla,
            })
          : await (async () => {
              const tractor = maquinariasFinca.find(m => m.id === maquinariaId)
              if (!tractor) return null
              return actions.continuarTarea(tareaContinuable.id, cuadros, cuadroIds, {
                persona,
                maquinaria: tractor.nombre,
                maquinariaModelo: tractor.modelo,
                maquinariaId: tractor.id,
              })
            })()

      if (result !== null) {
        onSuccess(tarea)
        onClose()
      }
      return
    }

    if (tipo === 'manual') {
      const n = parseInt(cantidadPersonas, 10)
      const id = await actions.crearManual(
        { cuadrilla, tarea, cantidadPersonas: n, cuadros, cuadroIds },
        ctx,
      )
      if (id) {
        onSuccess(tarea)
        onClose()
      }
      return
    }

    const tractor = maquinariasFinca.find(m => m.id === maquinariaId)
    if (!tractor) return

    const id = await actions.crearMecanica(
      {
        tarea,
        persona,
        maquinaria: tractor.nombre,
        maquinariaModelo: tractor.modelo,
        maquinariaId: tractor.id,
        cuadros,
        cuadroIds,
        ...(ordenCuraRef.trim() ? { ordenCuraRef: ordenCuraRef.trim() } : {}),
      },
      ctx,
    )
    if (id) {
      onSuccess(tarea)
      onClose()
    }
  }

  return (
    <div className="metric-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="metric-modal map-relevamiento-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asignar-labor-title"
        onClick={e => e.stopPropagation()}
        style={{ borderTopColor: '#0d9488' }}
      >
        <header className="metric-modal-header">
          <h2 id="asignar-labor-title">Asignar labor — {cuadro.id}</h2>
          <button type="button" className="metric-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="metric-modal-body map-relevamiento-modal-body">
          <p className="map-relevamiento-hint">
            Registro complementario cuando Campo no relevó el trabajo. No crea parte de labores.
          </p>

          <div className="map-relevamiento-tipo-toggle">
            <button
              type="button"
              className={tipo === 'manual' ? 'active' : ''}
              onClick={() => setTipo('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              className={tipo === 'mecanica' ? 'active' : ''}
              onClick={() => setTipo('mecanica')}
            >
              Mecánica
            </button>
          </div>

          {tipo === 'manual' ? (
            <>
              <div className="form-group">
                <label className="form-label">Cuadrilla</label>
                <select
                  className="form-select"
                  value={cuadrilla}
                  onChange={e => setCuadrilla(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {cuadrillas.map(c => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Labor</label>
                <select
                  className="form-select"
                  value={tarea}
                  onChange={e => setTarea(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {tareasManuales.map(t => (
                    <option key={t.id} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad de personas</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={cantidadPersonas}
                  onChange={e => setCantidadPersonas(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Labor</label>
                <select
                  className="form-select"
                  value={tarea}
                  onChange={e => setTarea(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {tareasMecanicas.map(t => (
                    <option key={t.id} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Operario</label>
                <input
                  className="form-input"
                  type="text"
                  value={persona}
                  onChange={e => setPersona(e.target.value)}
                  placeholder="Nombre del operario"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maquinaria</label>
                <select
                  className="form-select"
                  value={maquinariaId}
                  onChange={e => setMaquinariaId(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {maquinariasFinca.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} {m.modelo ? `(${m.modelo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {tarea === 'Curacion' && (
                <div className="form-group">
                  <label className="form-label">Orden de cura (opcional)</label>
                  <input
                    className="form-input"
                    type="text"
                    value={ordenCuraRef}
                    onChange={e => setOrdenCuraRef(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {tareaContinuable && (
            <p className="map-relevamiento-continue-hint">
              Se puede agregar a la tarea en progreso: {formatTareaMapLabel(tareaContinuable)}
            </p>
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
              className="btn-primary"
              disabled={!isValid || actions.busy}
              onClick={handleSubmit}
            >
              {actions.busy ? 'Guardando…' : 'Asignar labor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
