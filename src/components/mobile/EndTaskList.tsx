import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import type { Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'

interface Props {
  tareas: Tarea[]
  onSelectTarea: (tarea: Tarea) => void
  onBack: () => void
  fincaNombre: string
  emptyMessage?: string
}

export default function EndTaskList({
  tareas,
  onSelectTarea,
  onBack,
  fincaNombre,
  emptyMessage = 'No hay tareas en progreso',
}: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Cierre del día</h1>
        <p>{fincaNombre} — Tareas pendientes de cierre</p>
      </div>

      {tareas.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        tareas.map(tarea => {
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
