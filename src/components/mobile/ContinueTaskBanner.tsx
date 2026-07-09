import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import { tieneParteAbierto } from '../../utils/parteEstado'

interface Props {
  tarea: Tarea
  partesAbiertos: ParteDeLabores[]
}

export default function ContinueTaskBanner({ tarea, partesAbiertos }: Props) {
  const progress = computeTareaProgress(tarea)
  const parteAbierto = tieneParteAbierto(partesAbiertos, tarea.id)

  return (
    <>
      <div className="card continue-task-banner">
        <RefreshCw size={16} />
        <div>
          <strong>Ya existe esta tarea en progreso</strong>
          <small>
            {formatProgressLabel(progress)} · {(tarea.cuadros ?? []).join(', ')}
          </small>
          <small>Los cuadros nuevos se agregarán a la tarea existente.</small>
        </div>
      </div>

      {parteAbierto && (
        <div className="card continue-task-banner continue-task-banner--warn">
          <AlertCircle size={16} />
          <div>
            <strong>Parte de labores en jornada</strong>
            <small>
              Esta tarea ya tiene un parte abierto. Agregá cuadros si hace falta y cerrá la jornada
              en «Cierre del día» con el rendimiento.
            </small>
          </div>
        </div>
      )}
    </>
  )
}
