import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import {
  ejecutorKeyFromTareaOrOverride,
  findPartesAbiertosDeTarea,
  parteEjecutorKey,
  tieneParteAbiertoParaEjecutor,
} from '../../utils/parteEstado'
import type { OrigenEjecucion } from '../../utils/origenEjecucion'

interface Props {
  tarea: Tarea
  partesAbiertos: ParteDeLabores[]
  /** Texto para mensajes. */
  ejecutorActual?: string
  /** Cuadrilla (manual) o persona (mecánica) para la clave. */
  ejecutorClave?: string
  responsableClave?: string
  origenEjecucion?: OrigenEjecucion
}

export default function ContinueTaskBanner({
  tarea,
  partesAbiertos,
  ejecutorActual,
  ejecutorClave,
  responsableClave,
  origenEjecucion,
}: Props) {
  const progress = computeTareaProgress(tarea)
  const partesTarea = findPartesAbiertosDeTarea(partesAbiertos, tarea.id)
  const clave = ejecutorClave?.trim()
  const keyActual =
    clave && responsableClave?.trim()
      ? ejecutorKeyFromTareaOrOverride(tarea, {
          ...(tarea.tipo === 'manual'
            ? { cuadrilla: clave }
            : { persona: clave, origenEjecucion }),
          responsable: responsableClave,
        })
      : null
  const mismaJornadaAbierta =
    keyActual != null && tieneParteAbiertoParaEjecutor(partesAbiertos, tarea.id, keyActual)
  const otrasJornadas = keyActual
    ? partesTarea.filter(p => parteEjecutorKey(p) !== keyActual)
    : partesTarea

  const label = ejecutorActual ?? clave

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
            {label
              ? `Los cuadros nuevos quedan en la misma labor, con jornada de ${label}.`
              : 'Los cuadros nuevos se agregarán a la misma labor.'}
          </small>
        </div>
      </div>

      {mismaJornadaAbierta && (
        <div className="card continue-task-banner continue-task-banner--warn">
          <AlertCircle size={16} />
          <div>
            <strong>Jornada ya abierta</strong>
            <small>
              {label ?? 'Este ejecutor'} ya tiene un parte abierto para esta labor. Agregá
              cuadros si hace falta y cerrá el rendimiento en «Cierre del día».
            </small>
          </div>
        </div>
      )}

      {!mismaJornadaAbierta && otrasJornadas.length > 0 && label && responsableClave && (
        <div className="card continue-task-banner">
          <AlertCircle size={16} />
          <div>
            <strong>Otras jornadas en la misma labor</strong>
            <small>
              Se abrirá un parte aparte para {label}. Cada cuadrilla/empresa cierra su propio
              rendimiento.
            </small>
          </div>
        </div>
      )}
    </>
  )
}
