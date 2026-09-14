import { AlertCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ParteDeLabores, Tarea } from '../../types'
import { computeTareaProgress, formatProgressLabel } from '../../utils/tareaProgress'
import {
  ejecutorKeyFromTareaOrOverride,
  findParteVencidoParaEjecutor,
  findPartesAbiertosDeTarea,
  parteEjecutorKey,
  tieneParteAbiertoParaEjecutor,
} from '../../utils/parteEstado'
import type { OrigenEjecucion } from '../../utils/origenEjecucion'
import { MOBILE_ROUTES } from '../../mobile/routes'

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
  const navigate = useNavigate()
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
  const parteVencido =
    keyActual != null
      ? findParteVencidoParaEjecutor(partesAbiertos, tarea.id, keyActual)
      : undefined
  const mismaJornadaAbierta =
    keyActual != null &&
    !parteVencido &&
    tieneParteAbiertoParaEjecutor(partesAbiertos, tarea.id, keyActual)
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

      {parteVencido && (
        <div className="card continue-task-banner continue-task-banner--warn">
          <AlertCircle size={16} />
          <div>
            <strong>Parte de un día anterior sin cerrar</strong>
            <small>
              {label ?? 'Este ejecutor'} tiene un parte abierto de otro día. Cerralo con el
              rendimiento antes de abrir una jornada nueva.
            </small>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() =>
                navigate(MOBILE_ROUTES.finalizarDetalle(tarea.id, parteVencido.id))
              }
            >
              Cerrar parte pendiente
            </button>
          </div>
        </div>
      )}

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

      {!parteVencido && !mismaJornadaAbierta && otrasJornadas.length > 0 && label && responsableClave && (
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
