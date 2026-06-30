import { Clock, CheckCircle2, Users, Cog } from 'lucide-react'
import type { Tarea } from '../../types'
import {
  cuadroFinalizadoEnTarea,
  formatTareaEjecutor,
} from '../../utils/cuadroTareas'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface Props {
  enProgreso: Tarea[]
  finalizadas: Tarea[]
  cuadroId: string
  loading: boolean
  error: string | null
}

function TareaResumenItem({ tarea, cuadroId, cerrada }: { tarea: Tarea; cuadroId: string; cerrada: boolean }) {
  const ejecutor = formatTareaEjecutor(tarea)
  const cuadroCerrado = !cerrada && cuadroFinalizadoEnTarea(tarea, cuadroId)

  return (
    <li className="cuadro-public-tarea-item">
      <div className="cuadro-public-tarea-header">
        <span className={`cuadro-public-tarea-badge${cerrada ? ' is-done' : ''}`}>
          {cerrada ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {cerrada ? 'Realizada' : cuadroCerrado ? 'Cuadro listo' : 'En curso'}
        </span>
        <span className={`cuadro-public-tarea-tipo${tarea.tipo === 'manual' ? ' is-manual' : ''}`}>
          {tarea.tipo === 'manual' ? <Users size={11} /> : <Cog size={11} />}
          {tarea.tipo === 'manual' ? 'Manual' : 'Mecánica'}
        </span>
      </div>
      <h3 className="cuadro-public-tarea-nombre">{tarea.tarea}</h3>
      <p className="cuadro-public-tarea-ejecutor">
        {tarea.tipo === 'manual' ? 'Cuadrilla' : 'Operario'}: <strong>{ejecutor}</strong>
      </p>
      <p className="cuadro-public-tarea-fecha">
        {cerrada
          ? `Finalizada: ${formatTimestamp(tarea.fechaFin ?? tarea.fechaInicio, 'dd/MM/yyyy')}`
          : `Inicio: ${formatTimestamp(tarea.fechaInicio, 'dd/MM/yyyy')}`}
      </p>
      {cerrada && tarea.rendimiento?.trim() && (
        <p className="cuadro-public-tarea-rendimiento">
          Rendimiento: {tarea.rendimiento.trim()}
        </p>
      )}
    </li>
  )
}

export default function CuadroTareasResumen({
  enProgreso,
  finalizadas,
  cuadroId,
  loading,
  error,
}: Props) {
  if (loading) {
    return (
      <section className="cuadro-public-tareas">
        <p className="cuadro-public-tareas-loading">Cargando trabajos del cuadro…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="cuadro-public-tareas">
        <p className="cuadro-public-tareas-error">{error}</p>
      </section>
    )
  }

  const vacio = enProgreso.length === 0 && finalizadas.length === 0

  return (
    <section className="cuadro-public-tareas">
      <h2 className="cuadro-public-tareas-title">Trabajos en este cuadro</h2>

      {vacio ? (
        <p className="cuadro-public-tareas-empty">No hay trabajos registrados en este cuadro.</p>
      ) : (
        <>
          {enProgreso.length > 0 && (
            <div className="cuadro-public-tareas-group">
              <h3>
                <Clock size={16} />
                En progreso ({enProgreso.length})
              </h3>
              <ul>
                {enProgreso.map(t => (
                  <TareaResumenItem key={t.id} tarea={t} cuadroId={cuadroId} cerrada={false} />
                ))}
              </ul>
            </div>
          )}

          {finalizadas.length > 0 && (
            <div className="cuadro-public-tareas-group">
              <h3>
                <CheckCircle2 size={16} />
                Realizadas ({finalizadas.length})
              </h3>
              <ul>
                {finalizadas.map(t => (
                  <TareaResumenItem key={t.id} tarea={t} cuadroId={cuadroId} cerrada />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
