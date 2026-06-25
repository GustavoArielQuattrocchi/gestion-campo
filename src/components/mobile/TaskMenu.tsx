import { ChevronLeft, Play, Square, AlertTriangle } from 'lucide-react'

interface Props {
  fincaNombre: string
  onSelectInicio: () => void
  onSelectFin: () => void
  onSelectAccidente: () => void
  onBack: () => void
}

export default function TaskMenu({ fincaNombre, onSelectInicio, onSelectFin, onSelectAccidente, onBack }: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Cambiar finca
        </button>
        <h1>{fincaNombre}</h1>
        <p>Seleccioná una opción para continuar</p>
      </div>

      <div className="option-cards">
        <button type="button" className="option-card" onClick={onSelectInicio}>
          <div className="option-card-icon green">
            <Play size={24} />
          </div>
          <div className="option-card-content">
            <h3>Inicio de Tarea</h3>
            <p>Registrar una nueva tarea en campo</p>
          </div>
        </button>

        <button type="button" className="option-card" onClick={onSelectFin}>
          <div className="option-card-icon orange">
            <Square size={24} />
          </div>
          <div className="option-card-content">
            <h3>Cierre del día</h3>
            <p>Registrar rendimiento y cerrar parte de labores</p>
          </div>
        </button>

        <button type="button" className="option-card" onClick={onSelectAccidente}>
          <div className="option-card-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="option-card-content">
            <h3>Informe de Accidente</h3>
            <p>Reportar accidente o condición riesgosa</p>
          </div>
        </button>
      </div>
    </div>
  )
}
