import { ArrowLeftRight, ChevronLeft, PackagePlus, Plus } from 'lucide-react'
import { PUNTO_STOCK_LABEL, type PuntoStock } from '../../modules/stock/constants'
import type { StockSaldo } from '../../modules/stock/types'

interface Props {
  punto: PuntoStock
  saldos: StockSaldo[]
  loading: boolean
  onCarga: () => void
  onProducto: () => void
  onTransferencia: () => void
  onBack: () => void
}

export default function StockMenu({
  punto,
  saldos,
  loading,
  onCarga,
  onProducto,
  onTransferencia,
  onBack,
}: Props) {
  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Cambiar depósito
        </button>
        <h1>{PUNTO_STOCK_LABEL[punto]}</h1>
        <p>Stock del punto de almacenamiento</p>
      </div>

      <div className="option-cards">
        <button type="button" className="option-card" onClick={onCarga}>
          <div className="option-card-icon green"><Plus size={24} /></div>
          <div className="option-card-content">
            <h3>Cargar stock</h3>
            <p>Ingreso o conteo</p>
          </div>
        </button>
        <button type="button" className="option-card" onClick={onTransferencia}>
          <div className="option-card-icon green"><ArrowLeftRight size={24} /></div>
          <div className="option-card-content">
            <h3>Transferir</h3>
            <p>Pide confirmación en escritorio</p>
          </div>
        </button>
        <button type="button" className="option-card" onClick={onProducto}>
          <div className="option-card-icon green"><PackagePlus size={24} /></div>
          <div className="option-card-content">
            <h3>Nuevo producto</h3>
            <p>Queda pendiente de admin</p>
          </div>
        </button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Saldos en {punto}</div>
        {loading ? <p className="oc-muted">Cargando…</p> : null}
        {!loading && saldos.length === 0 ? <p className="oc-muted">Todavía no hay stock cargado.</p> : null}
        <ul className="jornada-list">
          {saldos.map(s => (
            <li key={s.id} className="jornada-item">
              <div className="jornada-item-info">
                <strong>{s.producto}</strong>
                <span>{s.ia || 'Sin I.A.'}</span>
              </div>
              <strong>{s.cantidad} {s.presentacion}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
