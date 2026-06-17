import { CheckCircle } from 'lucide-react'

interface Props {
  message: string
  detail?: string
  onContinue: () => void
}

export default function SuccessScreen({ message, detail, onContinue }: Props) {
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
      {detail && <p style={{ marginBottom: 32, maxWidth: 300 }}>{detail}</p>}
      <button
        className="btn btn-primary"
        onClick={onContinue}
        style={{ maxWidth: 300, width: '100%' }}
      >
        Continuar
      </button>
    </div>
  )
}
