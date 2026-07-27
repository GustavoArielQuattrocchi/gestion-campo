import { CheckCircle, Play, Square, ArrowLeft } from 'lucide-react'

interface Props {
  message: string
  detail?: string
  motivo?: string | null
  pendientesCierreCount?: number
  lastCreatedTareaId?: string | null
  lastCreatedParteId?: string | null
  onContinue: () => void
  onCerrarParte?: (tareaId: string, parteId: string) => void
  onCargarOtra?: () => void
  onCerrarSiguiente?: () => void
}

export default function SuccessScreen({
  message,
  detail,
  motivo,
  pendientesCierreCount = 0,
  lastCreatedTareaId,
  lastCreatedParteId,
  onContinue,
  onCerrarParte,
  onCargarOtra,
  onCerrarSiguiente,
}: Props) {
  const esInicio = motivo === 'inicio'
  const esRendimiento = motivo === 'rendimiento'

  return (
    <div className="start-screen fade-in">
      <div
        className="start-logo"
        style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          width: 80,
          height: 80,
          borderRadius: 24,
        }}
      >
        <CheckCircle size={40} color="white" />
      </div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>{message}</h1>
      {detail && <p style={{ marginBottom: 24, maxWidth: 300 }}>{detail}</p>}

      <div className="success-actions">
        {esInicio && lastCreatedTareaId && lastCreatedParteId && onCerrarParte && (
          <button
            className="btn btn-primary success-action-btn"
            onClick={() => onCerrarParte(lastCreatedTareaId, lastCreatedParteId)}
          >
            <Square size={18} />
            Cerrar parte de este día
          </button>
        )}

        {esInicio && onCargarOtra && (
          <button
            className="btn btn-secondary success-action-btn"
            onClick={onCargarOtra}
          >
            <Play size={18} />
            Cargar otra tarea
          </button>
        )}

        {esRendimiento && pendientesCierreCount > 0 && onCerrarSiguiente && (
          <button
            className="btn btn-primary success-action-btn"
            onClick={onCerrarSiguiente}
          >
            <Square size={18} />
            Cerrar siguiente jornada ({pendientesCierreCount} pendiente
            {pendientesCierreCount > 1 ? 's' : ''})
          </button>
        )}

        <button
          className="btn btn-ghost success-action-btn"
          onClick={onContinue}
        >
          <ArrowLeft size={18} />
          Volver al menú
        </button>
      </div>
    </div>
  )
}
