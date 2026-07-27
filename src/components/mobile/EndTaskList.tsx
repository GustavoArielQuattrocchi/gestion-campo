import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import { getEjecutorLabelFromParte } from '../../utils/tareaEjecutor'
import type { CierreParteItem } from '../../utils/parteEstado'

interface Props {
  items: CierreParteItem[]
  onSelect: (tarea: Tarea, parte: ParteDeLabores) => void
  onBack: () => void
  fincaNombre: string
  title?: string
  subtitle?: string
  emptyMessage?: string
  showFechaApertura?: boolean
}

function formatEjecutorDetalle(parte: ParteDeLabores): string {
  const label = getEjecutorLabelFromParte(parte)
  if (parte.tipo === 'manual' && parte.cantidadPersonas != null) {
    return `${label} · ${parte.cantidadPersonas} personas`
  }
  return label
}

export default function EndTaskList({
  items,
  onSelect,
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

      {items.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        items.map(({ tarea, parte }) => {
          const progress = computeTareaProgress(tarea)
          const ejecutor = formatEjecutorDetalle(parte)
          const finalizados = tarea.cuadroIdsFinalizados?.length ?? 0
          const totalCuadros = (tarea.cuadroIds ?? tarea.cuadros ?? []).length
          const cuadrosParte = (parte.cuadros ?? []).length

          return (
            <button
              type="button"
              key={parte.id}
              className="task-list-item task-list-item--rich"
              onClick={() => onSelect(tarea, parte)}
            >
              <div className="task-info">
                <h4>{tarea.tarea}</h4>
                <p className="task-list-ejecutor">{ejecutor}</p>
                {showFechaApertura && (
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
                {cuadrosParte > 0 && (
                  <p className="task-list-cuadros-info">
                    {cuadrosParte} cuadro{cuadrosParte > 1 ? 's' : ''} en esta jornada
                  </p>
                )}
                {finalizados > 0 && (
                  <p className="task-list-cuadros-info">
                    {finalizados} de {totalCuadros} cuadros finalizados (labor)
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
