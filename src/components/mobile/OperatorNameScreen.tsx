import { useState } from 'react'
import { User, ArrowRight } from 'lucide-react'

interface Props {
  onSubmit: (nombre: string) => Promise<boolean>
}

export default function OperatorNameScreen({ onSubmit }: Props) {
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    const trimmed = nombre.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSubmit(trimmed)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="start-screen fade-in">
      <div
        className="start-logo"
        style={{ width: 80, height: 80, borderRadius: 22 }}
      >
        <User size={36} color="white" />
      </div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>¿Quién carga hoy?</h1>
      <p style={{ marginBottom: 28, maxWidth: 280 }}>
        Ingresá tu nombre para registrar las tareas
      </p>

      <input
        type="text"
        className="form-input"
        placeholder="Tu nombre..."
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          maxWidth: 320,
          width: '100%',
          textAlign: 'center',
          fontSize: 18,
          padding: '14px 20px',
          marginBottom: 20,
        }}
      />

      <button
        className="btn btn-primary btn-lg"
        onClick={handleSubmit}
        disabled={!nombre.trim() || saving}
        style={{
          maxWidth: 320,
          width: '100%',
          opacity: nombre.trim() && !saving ? 1 : 0.5,
        }}
      >
        {saving ? 'Registrando...' : 'Continuar'}
        <ArrowRight size={20} />
      </button>
    </div>
  )
}
