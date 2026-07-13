import { Users } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeEjecutorBreakdown } from '../../utils/tareaEjecutorBreakdown'
import TaskProgressBar from './TaskProgressBar'

interface Props {
  tarea: Tarea
  partes: ParteDeLabores[]
}

export default function EjecutorBreakdownSection({ tarea, partes }: Props) {
  const rows = computeEjecutorBreakdown(tarea, partes)
  if (rows.length === 0) return null

  return (
    <div className="en-progreso-ejecutores">
      <h5>
        <Users size={14} />
        Avance por ejecutor
      </h5>
      <ul className="en-progreso-ejecutores-list">
        {rows.map(row => {
          const pct =
            row.hectareasAsignadas > 0
              ? Math.min(100, Math.round((row.hectareasFinalizadas / row.hectareasAsignadas) * 1000) / 10)
              : 0
          return (
            <li key={row.ejecutor} className="en-progreso-ejecutor-row">
              <div className="en-progreso-ejecutor-header">
                <strong>{row.ejecutor}</strong>
                <span className="en-progreso-ejecutor-stats">
                  {row.cuadrosFinalizados}/{row.cuadroIds.length} cuadros
                  {row.partesCount > 0 ? ` · ${row.partesCount} parte${row.partesCount > 1 ? 's' : ''}` : ''}
                </span>
              </div>
              {row.cuadroIds.length > 0 && (
                <TaskProgressBar
                  value={pct}
                  label={`${pct}% · ${row.hectareasFinalizadas.toFixed(1)} / ${row.hectareasAsignadas.toFixed(1)} ha asignadas`}
                  compact
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
