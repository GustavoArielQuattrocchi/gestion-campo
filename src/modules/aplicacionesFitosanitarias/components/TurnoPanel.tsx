import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { OrdenCuraWithItems } from '../../ordenesCura/types'
import { formatFactor } from '../../ordenesCura/utils/factor'
import type { CuadroDetalle } from '../../../data/fincaData'
import { formatOwnerLabel } from '../../ordenesCura/utils/ownerLabel'
import {
  diferenciaDosis,
  formatCantidad,
  formatCantidadConUnidad,
  formatDiferenciaDosis,
  hayDiferenciaDosis,
  type CalculoTurnoResult,
} from '../../../utils/aplicacionFitosanitaria'
import type { AplicacionFitosanitaria } from '../types'
import type { CuadroRow } from '../hooks/useAplicacionesFitosanitarias'
import GastoAcumulado from './GastoAcumulado'

interface Props {
  orden: OrdenCuraWithItems
  fincaCatalogo: string
  registradoPor: string
  fecha: string
  volumenLitros: string
  cuadros: CuadroRow[]
  cuadrosCatalogo: CuadroDetalle[]
  calculo: CalculoTurnoResult
  turnos: AplicacionFitosanitaria[]
  turnoId: string | null
  readOnly: boolean
  saving: boolean
  puedeGuardar: boolean
  onFecha: (value: string) => void
  onVolumen: (value: string) => void
  onAddCuadro: () => void
  onRemoveCuadro: (localId: string) => void
  onUpdateCuadro: (localId: string, patch: Partial<Pick<CuadroRow, 'cuadroId' | 'hileras'>>) => void
  onGuardar: () => void
  onNuevoTurno: () => void
  onEditarAbierto: () => void
  onVerTurno: (id: string) => void
  onEditarTurno: (id: string) => void
  onEliminarTurno: (id: string) => void
}

function formatFechaTurno(app: AplicacionFitosanitaria): string {
  return app.fecha.toDate().toLocaleDateString('es-AR')
}

function haDeFila(calculo: CalculoTurnoResult, index: number): string {
  const fila = calculo.cuadros[index]
  if (!fila) return '—'
  if (fila.omitido && fila.hileras > 0) return 'sin canopia'
  return formatCantidad(fila.haEstimada)
}

export default function TurnoPanel({
  orden,
  fincaCatalogo,
  registradoPor,
  fecha,
  volumenLitros,
  cuadros,
  cuadrosCatalogo,
  calculo,
  turnos,
  turnoId,
  readOnly,
  saving,
  puedeGuardar,
  onFecha,
  onVolumen,
  onAddCuadro,
  onRemoveCuadro,
  onUpdateCuadro,
  onGuardar,
  onNuevoTurno,
  onEditarAbierto,
  onVerTurno,
  onEditarTurno,
  onEliminarTurno,
}: Props) {
  const factor = orden.vol_aplicacion > 0 ? orden.vol_maquinaria / orden.vol_aplicacion : null
  const catalogoHint = fincaCatalogo !== orden.finca ? ` · catálogo ${fincaCatalogo}` : ''

  const extrasCuadros = useMemo(() => {
    const ids = new Set(cuadrosCatalogo.map(c => c.id))
    const seen = new Set<string>()
    const extras: { id: string; nombre: string }[] = []
    for (const row of cuadros) {
      if (!row.cuadroId || ids.has(row.cuadroId) || seen.has(row.cuadroId)) continue
      seen.add(row.cuadroId)
      extras.push({ id: row.cuadroId, nombre: row.nombre || row.cuadroId })
    }
    return extras
  }, [cuadros, cuadrosCatalogo])

  return (
    <div className="oc-main">
      <section className="oc-card">
        <h2>Orden {orden.oc}</h2>
        <p className="oc-muted">
          Receta de la OC en solo lectura. El turno no modifica la orden.
        </p>
        <div className="af-meta">
          <div><span>Finca</span><strong>{orden.finca}{catalogoHint}</strong></div>
          <div><span>Cultivo</span><strong>{orden.cultivo || '—'}</strong></div>
          <div><span>Manejo</span><strong>{orden.manejo || '—'}</strong></div>
          <div><span>Profesional</span><strong>{orden.tecnico || '—'}</strong></div>
          <div><span>Vol. tanque</span><strong>{orden.vol_maquinaria || '—'} L</strong></div>
          <div><span>Vol. aplicación</span><strong>{orden.vol_aplicacion || '—'} L/ha</strong></div>
          <div><span>Factor</span><strong>{formatFactor(factor)}</strong></div>
          <div><span>Maquinaria</span><strong>{orden.maquinaria || '—'}</strong></div>
        </div>
        {orden.indicaciones ? (
          <p className="af-indicaciones"><strong>Indicaciones: </strong>{orden.indicaciones}</p>
        ) : null}
        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>I.A.</th>
                <th>Pres.</th>
                <th>Dosis/ha</th>
                <th>Dosis/maq</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="oc-empty">La orden no tiene productos</td>
                </tr>
              ) : (
                orden.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.producto || '—'}</td>
                    <td>{item.ia || '—'}</td>
                    <td>{item.presentacion || '—'}</td>
                    <td>{item.dosis_ha || '—'}</td>
                    <td>{item.dosis_maquinada || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="oc-card">
        <div className="oc-tools">
          <h2 className="af-card-title">
            {turnoId ? (readOnly ? 'Turno guardado' : 'Editar turno') : 'Nuevo turno'}
          </h2>
          <div className="oc-tools-right">
            {turnoId && readOnly ? (
              <button type="button" className="oc-btn oc-btn--slate oc-btn--small" onClick={onEditarAbierto}>
                Editar
              </button>
            ) : null}
            <button type="button" className="oc-btn oc-btn--slate oc-btn--small" onClick={onNuevoTurno}>
              Nuevo turno
            </button>
          </div>
        </div>
        <p className="oc-muted">
          {readOnly
            ? 'Solo lectura. Usá Editar para corregir litros, cuadros e hileras, o Nuevo turno para cargar otro.'
            : `Litros de caldo del turno. El gasto se infiere de la receta. Registrado por ${registradoPor || '—'}.`}
        </p>
        <fieldset className="oc-fieldset" disabled={readOnly}>
          <div className="oc-row">
            <div>
              <label>Fecha del turno</label>
              <input
                className="oc-input"
                type="date"
                value={fecha}
                onChange={e => onFecha(e.target.value)}
              />
            </div>
            <div>
              <label>Litros de caldo</label>
              <input
                className="oc-input"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder="Ej. 800"
                value={volumenLitros}
                onChange={e => onVolumen(e.target.value)}
              />
            </div>
          </div>

          <div className="oc-tools">
            <h3 className="af-subheader">Cuadros e hileras</h3>
            <button type="button" className="oc-btn oc-btn--slate oc-btn--small" onClick={onAddCuadro}>
              <Plus size={14} /> Cuadro
            </button>
          </div>
          {cuadrosCatalogo.length === 0 ? (
            <p className="af-warn">No hay cuadros de catálogo para {fincaCatalogo || orden.finca}.</p>
          ) : null}
          <div className="oc-table-responsive">
            <table className="oc-table">
              <thead>
                <tr>
                  <th>Cuadro</th>
                  <th>Hileras</th>
                  <th>Canopia/ha</th>
                  <th>Canopia/hil</th>
                  <th>ha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cuadros.map((row, index) => {
                  const cat = cuadrosCatalogo.find(c => c.id === row.cuadroId)
                  const canopiaHa = cat && cat.canopia_ha > 0 ? cat.canopia_ha : row.canopia_ha
                  const canopiaHil = cat && cat.canopia_hil > 0 ? cat.canopia_hil : row.canopia_hil
                  return (
                    <tr key={row.localId}>
                      <td>
                        <select
                          className="oc-input"
                          value={row.cuadroId}
                          onChange={e => onUpdateCuadro(row.localId, { cuadroId: e.target.value })}
                        >
                          <option value="">Seleccioná…</option>
                          {extrasCuadros.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                          {cuadrosCatalogo.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.variedad})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="oc-input"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={row.hileras}
                          onChange={e => onUpdateCuadro(row.localId, { hileras: e.target.value })}
                        />
                      </td>
                      <td>{canopiaHa ? formatCantidad(canopiaHa, 0) : '—'}</td>
                      <td>{canopiaHil ? formatCantidad(canopiaHil, 0) : '—'}</td>
                      <td>{haDeFila(calculo, index)}</td>
                      <td>
                        <button
                          type="button"
                          className="oc-icon-btn"
                          onClick={() => onRemoveCuadro(row.localId)}
                          aria-label="Quitar cuadro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="af-kpis">
            <div className="af-kpi">
              <span>ha del turno</span>
              <strong>{formatCantidad(calculo.haTotal)}</strong>
            </div>
            <div className="af-kpi">
              <span>Caldo</span>
              <strong>{volumenLitros ? `${volumenLitros} L` : '—'}</strong>
            </div>
            <div className="af-kpi">
              <span>Vol. receta</span>
              <strong>{orden.vol_aplicacion ? `${orden.vol_aplicacion} L/ha` : '—'}</strong>
            </div>
          </div>

          {calculo.avisos.length > 0 && !readOnly ? (
            <ul className="af-avisos">
              {calculo.avisos.map(aviso => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          ) : null}

          <h3 className="af-subheader">Gasto inferido y dosis real</h3>
          <div className="oc-table-responsive">
            <table className="oc-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Dosis receta/ha</th>
                  <th>Gasto del turno</th>
                  <th>Dosis real/ha</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {calculo.productos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="oc-empty">Sin productos en la receta</td>
                  </tr>
                ) : (
                  calculo.productos.map((p, i) => {
                    const diff = diferenciaDosis(p.dosisRealHa, p.dosisHaReceta)
                    const marcada = hayDiferenciaDosis(diff)
                    const tono = !marcada ? '' : (diff ?? 0) > 0 ? 'af-diff-up' : 'af-diff-down'
                    return (
                      <tr key={`${p.producto}-${i}`} className={tono || undefined}>
                        <td>{p.producto || '—'}</td>
                        <td>{formatCantidadConUnidad(p.dosisHaReceta, p.presentacion)}</td>
                        <td>{formatCantidadConUnidad(p.gasto, p.presentacion)}</td>
                        <td>{formatCantidadConUnidad(p.dosisRealHa, p.presentacion)}</td>
                        <td className={marcada ? 'af-diff-value' : undefined}>
                          {formatDiferenciaDosis(diff, p.presentacion)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="af-save">
            <button
              type="button"
              className="oc-btn oc-btn--slate"
              onClick={onGuardar}
              disabled={!puedeGuardar}
            >
              {saving ? 'Guardando…' : turnoId ? 'Guardar cambios' : 'Guardar turno'}
            </button>
            {!puedeGuardar && !saving && !readOnly ? (
              <span className="oc-hint">Completá litros, cuadros con hileras y una receta con dosis/ha.</span>
            ) : null}
          </div>
        </fieldset>
      </section>

      <GastoAcumulado titulo="Gastado en esta orden" turnos={turnos} />

      <section className="oc-card">
        <h2>Turnos de esta orden</h2>
        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Litros</th>
                <th>ha</th>
                <th>Cuadros</th>
                <th>Productos</th>
                <th>Cargó</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="oc-empty">Todavía no hay turnos cargados</td>
                </tr>
              ) : (
                turnos.map(turno => (
                  <tr key={turno.id} className={turno.id === turnoId ? 'af-row-active' : undefined}>
                    <td>{formatFechaTurno(turno)}</td>
                    <td>{formatCantidad(turno.volumenLitros)} L</td>
                    <td>{formatCantidad(turno.haTotal)}</td>
                    <td>
                      {turno.cuadros
                        .filter(c => c.cuadroId)
                        .map(c => `${c.nombre} (${c.hileras} hil.)`)
                        .join(', ') || '—'}
                    </td>
                    <td>
                      {turno.productos
                        .filter(p => p.producto)
                        .map(p => `${p.producto}: ${formatCantidadConUnidad(p.gasto, p.presentacion)}`)
                        .join(' · ') || '—'}
                    </td>
                    <td>{formatOwnerLabel(turno.registrado_por)}</td>
                    <td>
                      <div className="oc-listado-actions">
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--slate"
                          onClick={() => onVerTurno(turno.id)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--slate"
                          onClick={() => onEditarTurno(turno.id)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="oc-btn oc-btn--small oc-btn--danger"
                          onClick={() => onEliminarTurno(turno.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
