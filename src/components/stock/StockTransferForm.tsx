import { useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { PUNTOS_STOCK, PUNTO_STOCK_LABEL, type PuntoStock } from '../../modules/stock/constants'
import { parseCantidadStock, productoKeyFromNombre } from '../../modules/stock/utils/stockMath'
import type { StockSaldo } from '../../modules/stock/types'
import type { ProductoCatalogoVista } from '../../data/agroQuimicos'

interface Props {
  punto: PuntoStock
  catalogo: ProductoCatalogoVista[]
  saldos: StockSaldo[]
  submitting?: boolean
  onSubmit: (input: {
    producto: string
    productoKey: string
    ia: string
    presentacion: string
    puntoDestino: PuntoStock
    cantidad: number
    nota?: string
  }) => Promise<boolean>
  onBack: () => void
}

export default function StockTransferForm({
  punto,
  catalogo,
  saldos,
  submitting,
  onSubmit,
  onBack,
}: Props) {
  const destinos = PUNTOS_STOCK.filter(p => p !== punto)
  const [productoId, setProductoId] = useState('')
  const [destino, setDestino] = useState<PuntoStock>(destinos[0] ?? 'FOA')
  const [cantidad, setCantidad] = useState('')
  const [nota, setNota] = useState('')

  const producto = useMemo(
    () => catalogo.find(p => p.id === productoId) ?? saldos.find(s => s.id === productoId),
    [catalogo, productoId, saldos],
  )

  const handleSubmit = async () => {
    if (!producto || submitting) return
    const n = parseCantidadStock(cantidad)
    if (n === null || n <= 0) return
    const nombre = 'nombre' in producto ? producto.nombre : producto.producto
    const ia = producto.ia
    const presentacion = 'presentacion' in producto ? producto.presentacion : ''
    await onSubmit({
      producto: nombre,
      productoKey: productoKeyFromNombre(nombre),
      ia,
      presentacion,
      puntoDestino: destino,
      cantidad: n,
      nota,
    })
  }

  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Menú
        </button>
        <h1>Transferir</h1>
        <p>Sale de {PUNTO_STOCK_LABEL[punto]} cuando el admin confirma.</p>
      </div>

      <label className="form-label">Producto
        <select className="form-select" value={productoId} onChange={e => setProductoId(e.target.value)}>
          <option value="">Elegí un producto</option>
          {saldos.map(s => (
            <option key={s.id} value={s.id}>{s.producto} · {s.cantidad} {s.presentacion}</option>
          ))}
          {catalogo.filter(p => !saldos.some(s => s.productoKey === productoKeyFromNombre(p.nombre))).map(p => (
            <option key={p.id} value={p.id}>{p.nombre} · sin saldo</option>
          ))}
        </select>
      </label>
      <label className="form-label">Destino
        <select className="form-select" value={destino} onChange={e => setDestino(e.target.value as PuntoStock)}>
          {destinos.map(p => <option key={p} value={p}>{PUNTO_STOCK_LABEL[p]}</option>)}
        </select>
      </label>
      <label className="form-label">Cantidad
        <input className="form-input" inputMode="decimal" value={cantidad} onChange={e => setCantidad(e.target.value)} />
      </label>
      <label className="form-label">Nota
        <input className="form-input" value={nota} onChange={e => setNota(e.target.value)} />
      </label>
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: 16 }}
        disabled={!producto || parseCantidadStock(cantidad) === null || submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? 'Enviando…' : 'Pedir transferencia'}
      </button>
    </div>
  )
}
