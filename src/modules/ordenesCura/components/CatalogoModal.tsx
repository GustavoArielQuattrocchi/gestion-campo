import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { ProductoCatalogo } from '../services/catalogoService'

interface Props {
  catalogo: ProductoCatalogo[]
  onEliminar: (productoId: string) => void
  onClose: () => void
}

export default function CatalogoModal({ catalogo, onEliminar, onClose }: Props) {
  const [q, setQ] = useState('')

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return catalogo
    return catalogo.filter(p => p.nombre.toLowerCase().includes(term))
  }, [catalogo, q])

  return (
    <div className="oc-modal" role="dialog" aria-modal="true">
      <div className="oc-sheet">
        <h3>Gestionar Productos</h3>
        <p className="oc-muted">Borrá los productos mal escritos o duplicados.</p>
        <input
          className="oc-input"
          type="text"
          placeholder="Filtrar productos..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div className="oc-cat-list">
          {filtrados.length === 0 ? (
            <div className="oc-empty">Sin productos</div>
          ) : (
            filtrados.map(producto => (
              <div key={producto.id} className="oc-cat-item">
                <span>
                  <strong>{producto.nombre}</strong>
                  {producto.ia ? <em> · {producto.ia}</em> : null}
                </span>
                <button
                  type="button"
                  className="oc-icon-btn"
                  aria-label={`Eliminar ${producto.nombre}`}
                  onClick={() => onEliminar(producto.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ textAlign: 'right', marginTop: 15 }}>
          <button type="button" className="oc-btn oc-btn--light" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
