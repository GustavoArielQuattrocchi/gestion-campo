import { ChevronLeft, MapPin } from 'lucide-react'
import { fincas } from '../../data/catalog'

interface Props {
  onSelect: (fincaId: string, fincaNombre: string) => void
  onBack: () => void
}

export default function FincaSelector({ onSelect, onBack }: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Seleccionar Finca</h1>
        <p>Elegí la finca donde vas a trabajar</p>
      </div>

      <div className="option-cards">
        {fincas.map((finca) => (
          <div
            key={finca.id}
            className="option-card"
            onClick={() => onSelect(finca.id, finca.nombre)}
          >
            <div className="option-card-icon green">
              <MapPin size={24} />
            </div>
            <div className="option-card-content">
              <h3>{finca.nombre}</h3>
              <p>Toque para seleccionar</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
