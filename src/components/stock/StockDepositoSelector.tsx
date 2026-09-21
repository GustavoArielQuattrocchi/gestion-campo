import { ChevronLeft, Package } from 'lucide-react'
import { PUNTOS_STOCK, PUNTO_STOCK_LABEL, type PuntoStock } from '../../modules/stock/constants'

interface Props {
  onSelect: (punto: PuntoStock) => void
  onBack: () => void
}

export default function StockDepositoSelector({ onSelect, onBack }: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver
        </button>
        <h1>Punto de almacenamiento</h1>
        <p>Elegí el depósito donde vas a trabajar</p>
      </div>
      <div className="option-cards">
        {PUNTOS_STOCK.map(punto => (
          <button type="button" key={punto} className="option-card" onClick={() => onSelect(punto)}>
            <div className="option-card-icon green">
              <Package size={24} />
            </div>
            <div className="option-card-content">
              <h3>{punto}</h3>
              <p>{PUNTO_STOCK_LABEL[punto]}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
