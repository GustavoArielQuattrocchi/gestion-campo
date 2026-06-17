import { useEffect } from 'react'
import { Sprout } from 'lucide-react'

interface Props {
  nombre: string
  onDone: () => void
}

export default function WelcomeScreen({ nombre, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="start-screen welcome-screen">
      <div className="welcome-icon">
        <Sprout size={44} color="white" />
      </div>
      <h1 className="welcome-title">
        Hola, <span className="welcome-name">{nombre}</span>
      </h1>
      <p className="welcome-subtitle">Bienvenido a Gestión de Campo</p>
      <div className="welcome-dots">
        <span className="welcome-dot" />
        <span className="welcome-dot" />
        <span className="welcome-dot" />
      </div>
    </div>
  )
}
