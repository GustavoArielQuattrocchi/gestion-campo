import { Trash2 } from 'lucide-react'
import type { ProductoCatalogo } from '../services/catalogoService'
import {
  CULTIVO_OPTIONS,
  FINCA_OPTIONS,
  MANEJO_OPTIONS,
  TECNICO_OPTIONS,
} from '../constants'
import { formatFactor } from '../utils/factor'
import type { ItemField, ItemRow, OrdenFormState } from '../hooks/useOrdenCuraEditor'

interface Props {
  form: OrdenFormState
  items: ItemRow[]
  factor: number | null
  catalogo: ProductoCatalogo[]
  onField: (field: keyof Omit<OrdenFormState, 'id'>, value: string) => void
  onItemChange: (localId: string, field: ItemField, value: string) => void
  onAddItem: () => void
  onRemoveItem: (localId: string) => void
  onClearItems: () => void
  onOpenCatalogo: () => void
}

export default function OrdenCuraForm({
  form,
  items,
  factor,
  catalogo,
  onField,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onClearItems,
  onOpenCatalogo,
}: Props) {
  return (
    <div className="oc-main">
      <div className="oc-grid">
        <section className="oc-card">
          <h2>Datos principales</h2>
          <div className="oc-row">
            <div>
              <label>N° OC</label>
              <input className="oc-input" type="text" value={form.oc} readOnly />
              <div className="oc-hint">
                {form.finca ? (
                  <>
                    Auto: <strong>{form.oc || '—'}</strong>
                  </>
                ) : (
                  'Seleccioná una finca para generar el N° OC'
                )}
              </div>
            </div>
            <div>
              <label>Fecha</label>
              <input
                className="oc-input"
                type="date"
                value={form.fecha}
                onChange={e => onField('fecha', e.target.value)}
              />
            </div>
          </div>
          <div className="oc-row">
            <div>
              <label>FINCA</label>
              <select
                className="oc-input"
                value={form.finca}
                onChange={e => onField('finca', e.target.value)}
              >
                <option value="">Seleccioná…</option>
                {FINCA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Cultivo</label>
              <select
                className="oc-input"
                value={form.cultivo}
                onChange={e => onField('cultivo', e.target.value)}
              >
                <option value="">Seleccioná…</option>
                {CULTIVO_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="oc-row">
            <div>
              <label>Manejo</label>
              <select
                className="oc-input"
                value={form.manejo}
                onChange={e => onField('manejo', e.target.value)}
              >
                <option value="">Seleccioná…</option>
                {MANEJO_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Profesional</label>
              <select
                className="oc-input"
                value={form.tecnico}
                onChange={e => onField('tecnico', e.target.value)}
              >
                <option value="">Seleccioná…</option>
                {TECNICO_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="oc-card">
          <h2>Aplicación</h2>
          <div className="oc-row">
            <div>
              <label>Tractorista</label>
              <input
                className="oc-input"
                type="text"
                value={form.tractorista}
                onChange={e => onField('tractorista', e.target.value)}
              />
            </div>
            <div>
              <label>Tractor</label>
              <input
                className="oc-input"
                type="text"
                value={form.tractor}
                onChange={e => onField('tractor', e.target.value)}
              />
            </div>
          </div>
          <div className="oc-row">
            <div>
              <label>Maquinaria</label>
              <input
                className="oc-input"
                type="text"
                value={form.maquinaria}
                onChange={e => onField('maquinaria', e.target.value)}
              />
            </div>
            <div>
              <label>Vol. Tanque (L)</label>
              <input
                className="oc-input"
                type="number"
                value={form.vol_maquinaria}
                onChange={e => onField('vol_maquinaria', e.target.value)}
              />
            </div>
          </div>
          <div className="oc-row">
            <div>
              <label>Aplicación (L/ha)</label>
              <input
                className="oc-input"
                type="number"
                value={form.vol_aplicacion}
                onChange={e => onField('vol_aplicacion', e.target.value)}
              />
            </div>
            <div>
              <label>Cuartel/Lote</label>
              <input
                className="oc-input"
                type="text"
                value={form.cuartel}
                onChange={e => onField('cuartel', e.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="oc-card">
        <h2>Productos</h2>
        <div className="oc-tools">
          <span className="oc-factor">Factor: {formatFactor(factor)}</span>
          <div className="oc-tools-right">
            <button type="button" className="oc-btn oc-btn--small oc-btn--slate" onClick={onOpenCatalogo}>
              ⚙️ Catálogo
            </button>
            <button type="button" className="oc-btn oc-btn--small oc-btn--light" onClick={onAddItem}>
              + Item
            </button>
            <button type="button" className="oc-btn oc-btn--small oc-btn--danger" onClick={onClearItems}>
              Vaciar
            </button>
          </div>
        </div>

        <datalist id="oc-dlProductos">
          {catalogo.map(p => (
            <option key={p.id} value={p.nombre} />
          ))}
        </datalist>

        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Producto</th>
                <th style={{ minWidth: 120 }}>Ing. Activo</th>
                <th style={{ minWidth: 80 }}>Pres.</th>
                <th style={{ minWidth: 80 }}>Dosis/ha</th>
                <th style={{ minWidth: 80 }}>Dosis/Maq</th>
                <th style={{ minWidth: 140 }}>Obs</th>
                <th style={{ width: 50 }} aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.localId}>
                  <td>
                    <input
                      className="oc-input"
                      list="oc-dlProductos"
                      value={row.producto}
                      onChange={e => onItemChange(row.localId, 'producto', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="oc-input"
                      value={row.ia}
                      onChange={e => onItemChange(row.localId, 'ia', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="oc-input"
                      value={row.presentacion}
                      onChange={e => onItemChange(row.localId, 'presentacion', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="oc-input"
                      value={row.dosis_ha}
                      onChange={e => onItemChange(row.localId, 'dosis_ha', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="oc-input"
                      value={row.dosis_maquinada}
                      onChange={e => onItemChange(row.localId, 'dosis_maquinada', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="oc-input"
                      value={row.obs}
                      onChange={e => onItemChange(row.localId, 'obs', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="oc-icon-btn"
                      aria-label="Eliminar item"
                      onClick={() => onRemoveItem(row.localId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label style={{ marginTop: 10 }}>Indicaciones generales</label>
        <textarea
          className="oc-input oc-textarea"
          value={form.indicaciones}
          onChange={e => onField('indicaciones', e.target.value)}
        />
      </section>
    </div>
  )
}
