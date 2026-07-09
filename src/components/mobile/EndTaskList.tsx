import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import { findParteAbierto } from '../../utils/parteEstado'

interface Props {
  tareas: Tarea[]
  partesAbiertos: ParteDeLabores[]
  onSelectTarea: (tarea: Tarea) => void
  onBack: () => void
  fincaNombre: string
  title?: string
  subtitle?: string
  emptyMessage?: string
  showFechaApertura?: boolean
}

export default function EndTaskList({
  tareas,
  partesAbiertos,
  onSelectTarea,
  onBack,
  fincaNombre,
  title = 'Cierre del día',
  subtitle,
  emptyMessage = 'No hay tareas en progreso',
  showFechaApertura = false,
}: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>{title}</h1>
        <p>{subtitle ?? `${fincaNombre} — Partes abiertos pendientes de cierre`}</p>
      </div>

      {tareas.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        tareas.map(tarea => {
          const parte = findParteAbierto(partesAbiertos, tarea.id)
          const progress = computeTareaProgress(tarea)
          const ejecutor =
            tarea.tipo === 'manual'
              ? `${tarea.cuadrilla} · ${tarea.cantidadPersonas} personas`
              : tarea.maquinariaModelo
                ? `${tarea.maquinaria} (${tarea.maquinariaModelo})`
                : `${tarea.persona} · ${tarea.maquinaria}`
          const finalizados = tarea.cuadroIdsFinalizados?.length ?? 0
          const totalCuadros = (tarea.cuadroIds ?? tarea.cuadros ?? []).length

          return (
            <button
              type="button"
              key={tarea.id}
              className="task-list-item task-list-item--rich"
              onClick={() => onSelectTarea(tarea)}
            >
              <div className="task-info">
                <h4>{tarea.tarea}</h4>
                <p className="task-list-ejecutor">{ejecutor}</p>
                {showFechaApertura && parte && (
                  <p className="task-list-fecha-apertura">
                    Abierto el {format(parte.abiertoEn.toDate(), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                )}
                <div className="task-list-progress-row">
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
                {finalizados > 0 && (
                  <p className="task-list-cuadros-info">
                    {finalizados} de {totalCuadros} cuadros finalizados
                  </p>
                )}
              </div>
              <ChevronRight size={20} color="#9ca3af" />
            </button>
          )
        })
      )}
    </div>
  )
}
