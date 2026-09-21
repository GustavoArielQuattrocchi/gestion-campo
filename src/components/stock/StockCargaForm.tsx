import { useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { ProductoCatalogoVista } from '../../data/agroQuimicos'
import { parseCantidadStock, productoKeyFromNombre } from '../../modules/stock/utils/stockMath'
import type { StockCargaInput, StockSaldo } from '../../modules/stock/types'

interface Props {
  catalogo: ProductoCatalogoVista[]
  saldos: StockSaldo[]
  submitting?: boolean
  onSubmit: (input: Omit<StockCargaInput, 'punto'>, modo: 'ingreso' | 'conteo') => Promise<boolean>
  onBack: () => void
}

export default function StockCargaForm({ catalogo, saldos, submitting, onSubmit, onBack }: Props) {
  const [q, setQ] = useState('')
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [modo, setModo] = useState<'ingreso' | 'conteo'>('ingreso')
  const [nota, setNota] = useState('')

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return catalogo
    return catalogo.filter(p => [p.nombre, p.ia, p.categoria].some(v => v.toLowerCase().includes(term)))
  }, [catalogo, q])

  const producto = catalogo.find(p => p.id === productoId)
  const saldo = producto
    ? saldos.find(s => s.productoKey === productoKeyFromNombre(producto.nombre))
    : undefined

  const handleSubmit = async () => {
    if (!producto || submitting) return
    const n = parseCantidadStock(cantidad)
    if (n === null) return
    await onSubmit({
      producto: producto.nombre,
      productoKey: productoKeyFromNombre(producto.nombre),
      ia: producto.ia,
      presentacion: producto.presentacion,
      cantidad: n,
      nota,
    }, modo)
  }

  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Menú
        </button>
        <h1>Cargar stock</h1>
        <p>Ingreso suma. Conteo pisa el saldo.</p>
      </div>

      <label className="form-label">Buscar producto
        <input className="form-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Nombre o I.A." />
      </label>
      <label className="form-label">Producto
        <select className="form-select" value={productoId} onChange={e => setProductoId(e.target.value)}>
          <option value="">Elegí un producto</option>
          {filtrados.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} · {p.presentacion}</option>
          ))}
        </select>
      </label>
      {producto ? (
        <p className="oc-muted">Saldo actual: <strong>{saldo?.cantidad ?? 0} {producto.presentacion}</strong></p>
      ) : null}
      <div className="oc-row" style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button type="button" className={`btn ${modo === 'ingreso' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModo('ingreso')}>Ingreso</button>
        <button type="button" className={`btn ${modo === 'conteo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setModo('conteo')}>Conteo</button>
      </div>
      <label className="form-label">Cantidad {producto ? `(${producto.presentacion})` : ''}
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
        {submitting ? 'Guardando…' : modo === 'conteo' ? 'Guardar conteo' : 'Guardar ingreso'}
      </button>
    </div>
  )
}
