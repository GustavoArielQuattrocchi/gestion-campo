import { ChevronLeft, Play, Square, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import type { Tarea } from '../../types'
import { tieneParteLaboresHoy } from '../../utils/parteLabores'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'

interface Props {
  fincaNombre: string
  tareasActivas: Tarea[]
  pendientesCierreCount: number
  onSelectInicio: () => void
  onSelectFin: () => void
  onSelectAccidente: () => void
  onCerrarTarea: (tareaId: string) => void
  onBack: () => void
}

export default function TaskMenu({
  fincaNombre,
  tareasActivas,
  pendientesCierreCount,
  onSelectInicio,
  onSelectFin,
  onSelectAccidente,
  onCerrarTarea,
  onBack,
}: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Cambiar finca
        </button>
        <h1>{fincaNombre}</h1>
        <p>Seleccioná una opción para continuar</p>
      </div>

      {tareasActivas.length > 0 && (
        <div className="card jornada-panel">
          <div className="card-title">Tareas activas</div>
          <ul className="jornada-list">
            {tareasActivas.map(tarea => {
              const cerradoHoy = tieneParteLaboresHoy(tarea)
              const progress = computeTareaProgress(tarea)
              const ejecutor =
                tarea.tipo === 'manual'
                  ? `${tarea.cuadrilla} · ${tarea.cantidadPersonas} pers.`
                  : tarea.maquinariaModelo
                    ? `${tarea.maquinaria} (${tarea.maquinariaModelo})`
                    : `${tarea.persona} · ${tarea.maquinaria}`

              return (
                <li key={tarea.id} className={`jornada-item ${cerradoHoy ? 'jornada-item--done' : ''}`}>
                  <div className="jornada-item-info">
                    <strong>{tarea.tarea}</strong>
                    <span className="jornada-item-meta">{ejecutor}</span>
                    <div className="jornada-progress-row">
                      <div className="jornada-progress-bar">
                        <div
                          className="jornada-progress-fill"
                          style={{ width: `${Math.min(100, progress.porcentaje)}%` }}
                        />
                      </div>
                      <span className="jornada-progress-label">
                        {formatProgressLabel(progress)}
                      </span>
                    </div>
                  </div>
                  {cerradoHoy ? (
                    <span className="jornada-badge-done">
                      <CheckCircle2 size={14} /> Cerrado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="jornada-btn-cerrar"
                      onClick={() => onCerrarTarea(tarea.id)}
                    >
                      Cerrar parte <ChevronRight size={14} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="option-cards">
        <button type="button" className="option-card" onClick={onSelectInicio}>
          <div className="option-card-icon green">
            <Play size={24} />
          </div>
          <div className="option-card-content">
            <h3>Cargar tarea</h3>
            <p>Registrar una nueva tarea en campo</p>
          </div>
        </button>

        <button type="button" className="option-card" onClick={onSelectFin}>
          <div className="option-card-icon orange">
            <Square size={24} />
          </div>
          <div className="option-card-content">
            <h3>Cierre del día</h3>
            <p>Registrar rendimiento y cerrar parte de labores</p>
          </div>
          {pendientesCierreCount > 0 && (
            <span className="option-card-badge">{pendientesCierreCount}</span>
          )}
        </button>

        <button type="button" className="option-card" onClick={onSelectAccidente}>
          <div className="option-card-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="option-card-content">
            <h3>Informe de Accidente</h3>
            <p>Reportar accidente o condición riesgosa</p>
          </div>
        </button>
      </div>
    </div>
  )
}
