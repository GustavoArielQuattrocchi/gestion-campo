import { Trash2 } from 'lucide-react'
import type { ProductoCatalogo } from '../../ordenesCura/services/catalogoService'
import {
  CULTIVO_OPTIONS,
  FINCA_OPTIONS,
  MANEJO_OPTIONS,
  TECNICO_OPTIONS,
} from '../../ordenesCura/constants'
import { AGRO_CATEGORIAS, findProductoCatalogo, groupCatalogo } from '../../../data/agroQuimicos'
import type { ItemField, ItemRow, OrdenFormState } from '../hooks/useOrdenFertilizacionEditor'

interface Props {
  form: OrdenFormState
  items: ItemRow[]
  catalogo: ProductoCatalogo[]
  readOnly: boolean
  onField: (field: keyof Omit<OrdenFormState, 'id'>, value: string) => void
  onItemChange: (localId: string, field: ItemField, value: string) => void
  onAddItem: () => void
  onRemoveItem: (localId: string) => void
  onClearItems: () => void
  onOpenCatalogo: () => void
}

export default function OrdenFertilizacionForm({
  form,
  items,
  catalogo,
  readOnly,
  onField,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onClearItems,
  onOpenCatalogo,
}: Props) {
  return (
    <div className="oc-main">
      <fieldset className="oc-fieldset" disabled={readOnly}>
        <div className="oc-grid">
          <section className="oc-card">
            <h2>Datos principales</h2>
            <div className="oc-row">
              <div>
                <label>N° OF</label>
                <input className="oc-input" type="text" value={form.of} readOnly />
                <div className="oc-hint">
                  {readOnly
                    ? 'Orden guardada · solo lectura. Usá Nueva para cargar otra orden.'
                    : form.finca ? (
                      <>
                        Auto: <strong>{form.of || '—'}</strong>
                      </>
                    ) : (
                      'Seleccioná una finca para generar el N° OF'
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
                <label>Responsable</label>
                <input
                  className="oc-input"
                  type="text"
                  value={form.responsable}
                  onChange={e => onField('responsable', e.target.value)}
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
            <span className="oc-hint">Dosis/aplicación = dosis/ha × superficie (ha)</span>
            <div className="oc-tools-right">
              <button type="button" className="oc-btn oc-btn--small oc-btn--slate" onClick={onOpenCatalogo}>
                ⚙️ Catálogo
              </button>
              <button type="button" className="oc-btn oc-btn--small oc-btn--slate" onClick={onAddItem}>
                + Item
              </button>
              <button type="button" className="oc-btn oc-btn--small oc-btn--danger" onClick={onClearItems}>
                Vaciar
              </button>
            </div>
          </div>

          <datalist id="of-dlProductos">
            {groupCatalogo(catalogo).flatMap(grupo =>
              grupo.productos.map(p => (
                <option key={p.id} value={p.nombre} label={`${grupo.categoria} · ${p.nombre}`} />
              )),
            )}
          </datalist>

          <div className="oc-table-responsive">
            <table className="oc-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 140 }}>Producto</th>
                  <th style={{ minWidth: 110 }}>Grupo</th>
                  <th style={{ minWidth: 120 }}>Ing. Activo</th>
                  <th style={{ minWidth: 80 }}>Pres.</th>
                  <th style={{ minWidth: 80 }}>Dosis/ha</th>
                  <th style={{ minWidth: 110 }}>Superficie (ha)</th>
                  <th style={{ minWidth: 120 }}>Dosis/aplicación</th>
                  <th style={{ width: 50 }} aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {items.map(row => {
                  const enCatalogo = Boolean(findProductoCatalogo(catalogo, row.producto))
                  const pideGrupo = Boolean(row.producto.trim()) && !enCatalogo
                  return (
                    <tr key={row.localId}>
                      <td>
                        <input
                          className="oc-input"
                          list="of-dlProductos"
                          value={row.producto}
                          onChange={e => onItemChange(row.localId, 'producto', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="oc-input"
                          value={row.grupo}
                          disabled={enCatalogo || !row.producto.trim()}
                          onChange={e => onItemChange(row.localId, 'grupo', e.target.value)}
                        >
                          <option value="">{pideGrupo ? 'Elegí grupo…' : '—'}</option>
                          {AGRO_CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
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
                          inputMode="decimal"
                          value={row.superficie}
                          onChange={e => onItemChange(row.localId, 'superficie', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="oc-input"
                          value={row.dosis_aplicacion}
                          readOnly
                          aria-label="Dosis por aplicación"
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
                  )
                })}
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
      </fieldset>
    </div>
  )
}
