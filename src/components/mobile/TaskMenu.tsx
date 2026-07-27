import { ChevronLeft, Play, Square, AlertTriangle, Clock, ChevronRight, History } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import {
  findPartesAbiertosDeTarea,
  isParteAbiertoHoy,
  isParteAbiertoVencido,
} from '../../utils/parteEstado'
import { getEjecutorLabelFromParte } from '../../utils/tareaEjecutor'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'

interface Props {
  fincaNombre: string
  tareasActivas: Tarea[]
  partesAbiertos: ParteDeLabores[]
  pendientesHoyCount: number
  pendientesVencidosCount: number
  onSelectInicio: () => void
  onSelectFin: () => void
  onSelectFinVencidos: () => void
  onSelectAccidente: () => void
  onCerrarParte: (tareaId: string, parteId: string) => void
  onBack: () => void
}

function formatEjecutorDetalle(parte: ParteDeLabores): string {
  const label = getEjecutorLabelFromParte(parte)
  if (parte.tipo === 'manual' && parte.cantidadPersonas != null) {
    return `${label} · ${parte.cantidadPersonas} pers.`
  }
  return label
}

export default function TaskMenu({
  fincaNombre,
  tareasActivas,
  partesAbiertos,
  pendientesHoyCount,
  pendientesVencidosCount,
  onSelectInicio,
  onSelectFin,
  onSelectFinVencidos,
  onSelectAccidente,
  onCerrarParte,
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
              const partesTarea = findPartesAbiertosDeTarea(partesAbiertos, tarea.id)
              const progress = computeTareaProgress(tarea)

              return (
                <li key={tarea.id} className="jornada-item jornada-item--stack">
                  <div className="jornada-item-info">
                    <strong>{tarea.tarea}</strong>
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

                  {partesTarea.length === 0 ? (
                    <span className="jornada-item-meta">Sin parte abierto hoy</span>
                  ) : (
                    <ul className="jornada-partes-list">
                      {partesTarea.map(parte => {
                        const enJornadaHoy = isParteAbiertoHoy(parte)
                        const enJornadaVencida = isParteAbiertoVencido(parte)
                        return (
                          <li key={parte.id} className="jornada-parte-row">
                            <div>
                              <span className="jornada-item-meta">{formatEjecutorDetalle(parte)}</span>
                              {enJornadaHoy && (
                                <span className="jornada-badge-jornada">
                                  <Clock size={14} /> En jornada
                                </span>
                              )}
                              {enJornadaVencida && (
                                <span className="jornada-badge-vencido">
                                  <History size={14} /> Pendiente día anterior
                                </span>
                              )}
                            </div>
                            {(enJornadaHoy || enJornadaVencida) && (
                              <button
                                type="button"
                                className="jornada-btn-cerrar"
                                onClick={() => onCerrarParte(tarea.id, parte.id)}
                              >
                                Cerrar jornada <ChevronRight size={14} />
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
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
            <h3>Abrir parte de labores</h3>
            <p>Iniciar jornada y registrar tarea en campo</p>
          </div>
        </button>

        <button type="button" className="option-card" onClick={onSelectFin}>
          <div className="option-card-icon orange">
            <Square size={24} />
          </div>
          <div className="option-card-content">
            <h3>Cierre del día</h3>
            <p>Cerrar partes abiertos hoy con el rendimiento</p>
          </div>
          {pendientesHoyCount > 0 && (
            <span className="option-card-badge">{pendientesHoyCount}</span>
          )}
        </button>

        <button type="button" className="option-card option-card--warn" onClick={onSelectFinVencidos}>
          <div className="option-card-icon amber">
            <History size={24} />
          </div>
          <div className="option-card-content">
            <h3>Cierres pendientes</h3>
            <p>Partes de días anteriores sin cerrar</p>
          </div>
          {pendientesVencidosCount > 0 && (
            <span className="option-card-badge option-card-badge--warn">{pendientesVencidosCount}</span>
          )}
        </button>

        <button type="button" className="option-card" onClick={onSelectAccidente}>
          <div className="option-card-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="option-card-content">
            <h3>Informe de Accidente</h3>
            <p>Registrar un incidente o accidente</p>
          </div>
        </button>
      </div>
    </div>
  )
}
