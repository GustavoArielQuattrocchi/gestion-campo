import { ChevronLeft, Play, Square, AlertTriangle, Clock, ChevronRight, History } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import {
  findParteAbierto,
  isParteAbiertoHoy,
  isParteAbiertoVencido,
} from '../../utils/parteEstado'
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
  onCerrarTarea: (tareaId: string) => void
  onBack: () => void
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
              const parte = findParteAbierto(partesAbiertos, tarea.id)
              const enJornadaHoy = parte ? isParteAbiertoHoy(parte) : false
              const enJornadaVencida = parte ? isParteAbiertoVencido(parte) : false
              const progress = computeTareaProgress(tarea)
              const ejecutor =
                tarea.tipo === 'manual'
                  ? `${tarea.cuadrilla} · ${tarea.cantidadPersonas} pers.`
                  : tarea.maquinariaModelo
                    ? `${tarea.maquinaria} (${tarea.maquinariaModelo})`
                    : `${tarea.persona} · ${tarea.maquinaria}`

              return (
                <li key={tarea.id} className="jornada-item">
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
                  <div className="jornada-item-actions">
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
                    {enJornadaHoy && (
                      <button
                        type="button"
                        className="jornada-btn-cerrar"
                        onClick={() => onCerrarTarea(tarea.id)}
                      >
                        Cerrar jornada <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
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
            <p>Reportar accidente o condición riesgosa</p>
          </div>
        </button>
      </div>
    </div>
  )
}
