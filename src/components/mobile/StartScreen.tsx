import { Sprout } from 'lucide-react'

interface Props {
  onStart: () => void
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="start-screen fade-in">
      <div className="start-logo">
        <Sprout size={48} color="white" />
      </div>
      <h1>Gestión de Campo</h1>
      <p>Control y seguimiento de tareas agrícolas</p>
      <button className="btn btn-primary btn-lg" onClick={onStart} style={{ width: '100%', maxWidth: 320 }}>
        <Sprout size={20} />
        Iniciar Aplicación
      </button>
    </div>
  )
}
