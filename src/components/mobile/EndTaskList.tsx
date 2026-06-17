import { ChevronLeft, Clock, ChevronRight, Inbox } from 'lucide-react'
import type { Tarea } from '../../types'

interface Props {
  tareas: Tarea[]
  onSelectTarea: (tarea: Tarea) => void
  onBack: () => void
  fincaNombre: string
}

export default function EndTaskList({ tareas, onSelectTarea, onBack, fincaNombre }: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Fin de Tarea</h1>
        <p>{fincaNombre} — Tareas en progreso</p>
      </div>

      {tareas.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <p>No hay tareas en progreso</p>
        </div>
      ) : (
        tareas.map(tarea => (
          <div
            key={tarea.id}
            className="task-list-item"
            onClick={() => onSelectTarea(tarea)}
          >
            <div className="option-card-icon green" style={{ width: 40, height: 40 }}>
              <Clock size={20} />
            </div>
            <div className="task-info">
              <h4>{tarea.tarea}</h4>
              <p>
                {tarea.tipo === 'manual'
                  ? `${tarea.cuadrilla} · ${tarea.cantidadPersonas} personas`
                  : `${tarea.persona} · ${tarea.maquinaria}`
                }
                {' · '}
                {(tarea.cuadros ?? []).join(', ') || '—'}
              </p>
            </div>
            <ChevronRight size={20} color="#9ca3af" />
          </div>
        ))
      )}
    </div>
  )
}
