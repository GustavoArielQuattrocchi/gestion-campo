import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import { tieneParteAbierto } from '../../utils/parteEstado'
import { getEjecutorLabelFromTarea } from '../../utils/tareaEjecutor'

interface Props {
  tarea: Tarea
  partesAbiertos: ParteDeLabores[]
  /** Ejecutor que va a trabajar en los cuadros nuevos (p. ej. otra cuadrilla). */
  ejecutorActual?: string
}

export default function ContinueTaskBanner({ tarea, partesAbiertos, ejecutorActual }: Props) {
  const progress = computeTareaProgress(tarea)
  const parteAbierto = tieneParteAbierto(partesAbiertos, tarea.id)
  const ejecutorTarea = getEjecutorLabelFromTarea(tarea)
  const otroEjecutor = ejecutorActual && ejecutorActual !== ejecutorTarea

  return (
    <>
      <div className="card continue-task-banner">
        <RefreshCw size={16} />
        <div>
          <strong>Ya hay una labor en progreso en esta finca</strong>
          <small>
            {tarea.tarea} — {formatProgressLabel(progress)} sobre la finca
          </small>
          <small>
            {otroEjecutor
              ? `Los cuadros nuevos quedarán asignados a ${ejecutorActual}.`
              : 'Los cuadros nuevos se agregarán a la misma tarea.'}
          </small>
        </div>
      </div>

      {parteAbierto && (
        <div className="card continue-task-banner continue-task-banner--warn">
          <AlertCircle size={16} />
          <div>
            <strong>Parte de labores en jornada</strong>
            <small>
              Esta labor ya tiene un parte abierto. Agregá cuadros si hace falta y cerrá la jornada
              en «Cierre del día» con el rendimiento.
            </small>
          </div>
        </div>
      )}
    </>
  )
}
