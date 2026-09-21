import { Package } from 'lucide-react'

interface Props {
  onStart: () => void
}

export default function StockStartScreen({ onStart }: Props) {
  return (
    <div className="start-screen fade-in">
      <div className="start-logo">
        <Package size={48} color="white" />
      </div>
      <h1>App de Stock</h1>
      <p>Carga y transferencia de agroquímicos</p>
      <button className="btn btn-primary btn-lg" onClick={onStart} style={{ width: '100%', maxWidth: 320 }}>
        <Package size={20} />
        Iniciar Aplicación
      </button>
    </div>
  )
}
