import { useEffect, useMemo, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import {
  AGRO_CATEGORIAS,
  AGRO_MANEJO_CATALOGO,
  AGRO_UM_OPTIONS,
  groupCatalogo,
  nextAgroCodigo,
} from '../../../data/agroQuimicos'
import type { ProductoCatalogo, ProductoCatalogoAlta } from '../services/catalogoService'

interface Props {
  catalogo: ProductoCatalogo[]
  onAlta: (input: ProductoCatalogoAlta) => Promise<void>
  onEliminar: (productoId: string) => void
  onClose: () => void
}

const emptyAlta = (): ProductoCatalogoAlta => ({
  categoria: 'Fungicida',
  nombre: '',
  ia: '',
  presentacion: 'kg',
  dosis_ha: '',
  description: '',
  management: 'Convencional',
})

export default function CatalogoModal({ catalogo, onAlta, onEliminar, onClose }: Props) {
  const [q, setQ] = useState('')
  const [alta, setAlta] = useState<ProductoCatalogoAlta>(emptyAlta)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const siguienteCodigo = nextAgroCodigo(catalogo.map(p => p.codigo))

  const grupos = useMemo(() => {
    const term = q.trim().toLowerCase()
    const filtrados = term
      ? catalogo.filter(p =>
          [p.nombre, p.ia, p.categoria].some(v => v.toLowerCase().includes(term)),
        )
      : catalogo
    return groupCatalogo(filtrados)
  }, [catalogo, q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleAlta() {
    if (!alta.nombre.trim()) {
      setError('Completá el nombre del producto.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onAlta(alta)
      setAlta(emptyAlta())
    } catch (err) {
      console.error('[Catalogo] No se pudo dar de alta:', err)
      setError(err instanceof Error && err.message === 'duplicado'
        ? 'Ese nombre ya está en el catálogo.'
        : 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="oc-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Catálogo de productos"
      onClick={onClose}
    >
      <div className="oc-sheet oc-sheet--catalogo" onClick={e => e.stopPropagation()}>
        <div className="oc-sheet-head">
          <h3>Catálogo de productos</h3>
          <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>
            <X size={16} />
            Volver a la OC
          </button>
        </div>
        <div className="oc-sheet-body">
        <p className="oc-muted">
          La base viene del archivo. Los productos nuevos se guardan en Firestore con grupo e id.
          Id siguiente: <strong>{siguienteCodigo}</strong>
        </p>

        <div className="oc-cat-alta">
          <label>
            Grupo
            <select
              className="oc-input"
              value={alta.categoria}
              onChange={e => setAlta(prev => ({ ...prev, categoria: e.target.value }))}
            >
              {AGRO_CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input
              className="oc-input"
              value={alta.nombre}
              onChange={e => setAlta(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </label>
          <label>
            I.A.
            <input
              className="oc-input"
              value={alta.ia}
              onChange={e => setAlta(prev => ({ ...prev, ia: e.target.value }))}
            />
          </label>
          <label>
            UM
            <select
              className="oc-input"
              value={alta.presentacion}
              onChange={e => setAlta(prev => ({ ...prev, presentacion: e.target.value }))}
            >
              {AGRO_UM_OPTIONS.map(um => (
                <option key={um} value={um}>{um}</option>
              ))}
            </select>
          </label>
          <label>
            Dosis/ha
            <input
              className="oc-input"
              value={alta.dosis_ha}
              onChange={e => setAlta(prev => ({ ...prev, dosis_ha: e.target.value }))}
            />
          </label>
          <label>
            Manejo
            <select
              className="oc-input"
              value={alta.management}
              onChange={e => setAlta(prev => ({ ...prev, management: e.target.value }))}
            >
              {AGRO_MANEJO_CATALOGO.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <label className="oc-cat-alta-wide">
            Descripción
            <input
              className="oc-input"
              value={alta.description}
              onChange={e => setAlta(prev => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className="oc-btn oc-btn--small oc-btn--slate"
            onClick={() => void handleAlta()}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
        {error ? <p className="oc-hint oc-cat-error">{error}</p> : null}

        <input
          className="oc-input"
          type="text"
          placeholder="Filtrar por grupo, nombre o I.A...."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ margin: '12px 0 10px' }}
        />
        <div className="oc-cat-list">
          {grupos.length === 0 ? (
            <div className="oc-empty">Sin productos</div>
          ) : (
            grupos.map(grupo => (
              <section key={grupo.categoria} className="oc-cat-grupo">
                <h4>{grupo.categoria}</h4>
                {grupo.productos.map(producto => (
                  <div key={producto.id} className="oc-cat-item">
                    <span>
                      <strong>{producto.nombre}</strong>
                      <em>
                        {' '}· {producto.codigo}
                        {producto.ia ? ` · ${producto.ia}` : ''}
                        {producto.presentacion ? ` · ${producto.presentacion}` : ''}
                        {producto.origen === 'static' ? ' · base' : ' · extra'}
                      </em>
                    </span>
                    {producto.origen === 'extra' ? (
                      <button
                        type="button"
                        className="oc-icon-btn"
                        aria-label={`Eliminar ${producto.nombre}`}
                        onClick={() => onEliminar(producto.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
        </div>
        <div className="oc-sheet-foot">
          <button type="button" className="oc-btn oc-btn--slate" onClick={onClose}>
            <X size={16} />
            Volver a la OC
          </button>
        </div>
      </div>
    </div>
  )
}
