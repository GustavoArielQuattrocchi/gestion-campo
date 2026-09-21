import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { AGRO_CATEGORIAS, AGRO_MANEJO_CATALOGO, AGRO_UM_OPTIONS } from '../../data/agroQuimicos'
import type { ProductoCatalogoAlta } from '../../modules/ordenesCura/services/catalogoService'

interface Props {
  submitting?: boolean
  onSubmit: (input: ProductoCatalogoAlta) => Promise<boolean>
  onBack: () => void
}

const empty = (): ProductoCatalogoAlta => ({
  categoria: 'Fungicida',
  nombre: '',
  ia: '',
  presentacion: 'L',
  dosis_ha: '',
  description: '',
  management: 'Convencional',
})

export default function StockProductoForm({ submitting, onSubmit, onBack }: Props) {
  const [alta, setAlta] = useState(empty)

  const canSave = alta.nombre.trim() && alta.ia.trim() && alta.categoria && alta.presentacion

  return (
    <div className="container fade-in">
      <div className="mobile-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Menú
        </button>
        <h1>Nuevo producto</h1>
        <p>El admin lo confirma en el escritorio antes de entrar al catálogo.</p>
      </div>

      <label className="form-label">Grupo
        <select className="form-select" value={alta.categoria} onChange={e => setAlta(p => ({ ...p, categoria: e.target.value }))}>
          {AGRO_CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="form-label">Nombre
        <input className="form-input" value={alta.nombre} onChange={e => setAlta(p => ({ ...p, nombre: e.target.value }))} />
      </label>
      <label className="form-label">Principio activo
        <input className="form-input" value={alta.ia} onChange={e => setAlta(p => ({ ...p, ia: e.target.value }))} />
      </label>
      <label className="form-label">Unidad
        <select className="form-select" value={alta.presentacion} onChange={e => setAlta(p => ({ ...p, presentacion: e.target.value }))}>
          {AGRO_UM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <label className="form-label">Manejo
        <select className="form-select" value={alta.management} onChange={e => setAlta(p => ({ ...p, management: e.target.value }))}>
          {AGRO_MANEJO_CATALOGO.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="form-label">Dosis/ha (opcional)
        <input className="form-input" value={alta.dosis_ha} onChange={e => setAlta(p => ({ ...p, dosis_ha: e.target.value }))} />
      </label>
      <label className="form-label">Descripción (opcional)
        <input className="form-input" value={alta.description} onChange={e => setAlta(p => ({ ...p, description: e.target.value }))} />
      </label>
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginTop: 16 }}
        disabled={!canSave || submitting}
        onClick={() => void onSubmit(alta)}
      >
        {submitting ? 'Enviando…' : 'Enviar a confirmación'}
      </button>
    </div>
  )
}
