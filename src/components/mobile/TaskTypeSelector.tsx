import { ChevronLeft, Users, Cog } from 'lucide-react'

interface Props {
  onSelectManual: () => void
  onSelectMecanica: () => void
  onBack: () => void
}

export default function TaskTypeSelector({ onSelectManual, onSelectMecanica, onBack }: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Tipo de Tarea</h1>
        <p>Seleccioná el tipo de tarea a registrar</p>
      </div>

      <div className="option-cards">
        <button type="button" className="option-card" onClick={onSelectManual}>
          <div className="option-card-icon green">
            <Users size={24} />
          </div>
          <div className="option-card-content">
            <h3>Manual</h3>
            <p>Tarea realizada por cuadrilla de personal</p>
          </div>
        </button>

        <button type="button" className="option-card" onClick={onSelectMecanica}>
          <div className="option-card-icon blue">
            <Cog size={24} />
          </div>
          <div className="option-card-content">
            <h3>Mecánica</h3>
            <p>Tarea realizada con maquinaria agrícola</p>
          </div>
        </button>
      </div>
    </div>
  )
}
