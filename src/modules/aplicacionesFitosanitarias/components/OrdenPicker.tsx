import { useMemo, useState } from 'react'
import type { OrdenCura } from '../../ordenesCura/types'
import { formatOwnerLabel } from '../../ordenesCura/utils/ownerLabel'
import {
  FILTRO_CAMPANA_TODAS,
  FILTRO_FINCA_SIN,
  FILTRO_FINCA_TODAS,
  campanaFromDate,
  coincideCampana,
  coincideFincaGasto,
  fincaGastoKey,
  fincaGastoLabel,
  listCampanas,
  listFincasGasto,
} from '../../../utils/aplicacionFitosanitaria'
import type { AplicacionFitosanitaria } from '../types'
import GastoAcumulado from './GastoAcumulado'

interface Props {
  ordenes: OrdenCura[]
  aplicaciones: AplicacionFitosanitaria[]
  loading: boolean
  onSelect: (ordenId: string) => void
}

function formatFecha(orden: OrdenCura): string {
  return orden.fecha.toDate().toLocaleDateString('es-AR')
}

function tituloGasto(filtroFinca: string, filtroCampana: string): string {
  const finca =
    filtroFinca === FILTRO_FINCA_TODAS
      ? 'todas las fincas'
      : filtroFinca === FILTRO_FINCA_SIN
        ? fincaGastoLabel('')
        : filtroFinca
  const campana = filtroCampana === FILTRO_CAMPANA_TODAS ? 'todas las campañas' : filtroCampana
  return `Gastado en ${finca} · ${campana}`
}

export default function OrdenPicker({ ordenes, aplicaciones, loading, onSelect }: Props) {
  const [q, setQ] = useState('')
  const [filtroFinca, setFiltroFinca] = useState(FILTRO_FINCA_TODAS)
  const [filtroCampana, setFiltroCampana] = useState(() => campanaFromDate(new Date()))

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const app of aplicaciones) {
      map.set(app.ordenId, (map.get(app.ordenId) ?? 0) + 1)
    }
    return map
  }, [aplicaciones])

  const campanas = useMemo(() => {
    const fechas = [
      ...ordenes.map(o => o.fecha.toDate()),
      ...aplicaciones.map(a => a.fecha.toDate()),
    ]
    return listCampanas(fechas)
  }, [ordenes, aplicaciones])

  const porCampanaOrdenes = useMemo(
    () => ordenes.filter(o => coincideCampana(o.fecha.toDate(), filtroCampana)),
    [ordenes, filtroCampana],
  )

  const porCampanaApps = useMemo(
    () => aplicaciones.filter(a => coincideCampana(a.fecha.toDate(), filtroCampana)),
    [aplicaciones, filtroCampana],
  )

  const fincas = useMemo(
    () =>
      listFincasGasto([
        ...porCampanaOrdenes.map(o => ({ finca: o.finca })),
        ...porCampanaApps.map(a => ({ finca: a.finca, fincaCatalogo: a.fincaCatalogo })),
      ]),
    [porCampanaOrdenes, porCampanaApps],
  )

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase()
    return porCampanaOrdenes.filter(o => {
      if (!coincideFincaGasto(o.finca, o.finca, filtroFinca)) return false
      if (!term) return true
      const fincaLabel = fincaGastoLabel(fincaGastoKey(o.finca))
      return [o.oc, o.finca, fincaLabel, o.cultivo, o.owner_email, formatFecha(o)].some(v =>
        v.toLowerCase().includes(term),
      )
    })
  }, [porCampanaOrdenes, filtroFinca, q])

  const appsFiltradas = useMemo(
    () => porCampanaApps.filter(a => coincideFincaGasto(a.finca, a.fincaCatalogo, filtroFinca)),
    [porCampanaApps, filtroFinca],
  )

  return (
    <div className="oc-main">
      <GastoAcumulado
        titulo={tituloGasto(filtroFinca, filtroCampana)}
        turnos={appsFiltradas}
        desglosePorFinca={filtroFinca === FILTRO_FINCA_TODAS}
      />
      <section className="oc-card">
        <h2>Elegí una orden de cura</h2>
        <p className="oc-muted">
          Historial compartido: ves las OC de todos los admins. Cada turno se guarda aparte; el gasto
          se infiere de la receta.
        </p>
        <div className="oc-listado-filters">
          <label className="oc-listado-filter">
            <span>Campaña</span>
            <select
              className="oc-input"
              value={filtroCampana}
              onChange={e => {
                setFiltroCampana(e.target.value)
                setFiltroFinca(FILTRO_FINCA_TODAS)
              }}
            >
              <option value={FILTRO_CAMPANA_TODAS}>Todas</option>
              {campanas.map(campana => (
                <option key={campana} value={campana}>{campana}</option>
              ))}
            </select>
          </label>
          <label className="oc-listado-filter">
            <span>Finca</span>
            <select
              className="oc-input"
              value={filtroFinca}
              onChange={e => setFiltroFinca(e.target.value)}
            >
              <option value={FILTRO_FINCA_TODAS}>Todas</option>
              {fincas.map(finca => (
                <option key={finca.key || FILTRO_FINCA_SIN} value={finca.key || FILTRO_FINCA_SIN}>
                  {finca.label}
                </option>
              ))}
            </select>
          </label>
          <label className="oc-listado-filter oc-listado-filter--grow">
            <span>Buscar</span>
            <input
              className="oc-input"
              type="text"
              placeholder="N° OC, fecha, cultivo o quien cargó..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>
        </div>
        <div className="oc-table-responsive">
          <table className="oc-table">
            <thead>
              <tr>
                <th>OC</th>
                <th>Fecha</th>
                <th>Finca</th>
                <th>Cultivo</th>
                <th>Cargó</th>
                <th>Turnos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="oc-empty">Cargando órdenes…</td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="oc-empty">No hay órdenes guardadas</td>
                </tr>
              ) : (
                filtradas.map(orden => (
                  <tr key={orden.id}>
                    <td>{orden.oc}</td>
                    <td>{formatFecha(orden)}</td>
                    <td>{fincaGastoLabel(fincaGastoKey(orden.finca))}</td>
                    <td>{orden.cultivo || '—'}</td>
                    <td>{formatOwnerLabel(orden.owner_email)}</td>
                    <td>{counts.get(orden.id) ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className="oc-btn oc-btn--small oc-btn--slate"
                        onClick={() => onSelect(orden.id)}
                      >
                        Cargar turno
                      </button>
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
