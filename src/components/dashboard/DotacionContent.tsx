import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import type { ParteDeLabores } from '../../types'
import {
  buildDotacionRows,
  computeDotacionPorFincaFromRows,
  computeDotacionPromedioDiario,
  computeDotacionTotal,
  dotacionTipoLabel,
  filterDotacionRows,
  filterDotacionRowsByFecha,
  formatDotacionPeriodoLabel,
  listDotacionFechas,
  listDotacionFincas,
  listDotacionTareas,
  localTodayKey,
  type DotacionFechaModo,
  type DotacionFilters,
} from '../../utils/dotacion'

interface Props {
  partes: ParteDeLabores[]
}

function DotacionFincaBars({ items }: { items: { finca: string; personas: number }[] }) {
  if (items.length === 0) {
    return <p className="dotacion-finca-bars-empty">Sin dotación en el período seleccionado</p>
  }

  const max = Math.max(...items.map(i => i.personas), 1)

  return (
    <ul className="dotacion-finca-bars" aria-label="Dotación por finca">
      {items.map(item => (
        <li key={item.finca} className="dotacion-finca-bar-row">
          <span className="dotacion-finca-bar-name" title={item.finca}>
            {item.finca}
          </span>
          <div className="dotacion-finca-bar-track" aria-hidden>
            <div
              className="dotacion-finca-bar-fill"
              style={{ width: `${(item.personas / max) * 100}%` }}
            />
          </div>
          <span className="dotacion-finca-bar-value">{item.personas}</span>
        </li>
      ))}
    </ul>
  )
}

export default function DotacionContent({ partes }: Props) {
  const hoy = localTodayKey()
  const allRows = useMemo(() => buildDotacionRows(partes), [partes])
  const fincasDisponibles = useMemo(() => listDotacionFincas(partes), [partes])
  const tareasDisponibles = useMemo(() => listDotacionTareas(partes), [partes])
  const fechasDisponibles = useMemo(() => listDotacionFechas(partes), [partes])

  const [filtroFinca, setFiltroFinca] = useState('todas')
  const [filtroTarea, setFiltroTarea] = useState('todas')
  const [fechaModo, setFechaModo] = useState<DotacionFechaModo>('dia')
  const [filtroFecha, setFiltroFecha] = useState(hoy)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(
    () => fechasDisponibles[0] ?? hoy,
  )
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(hoy)

  const fechaFilters = useMemo(
    (): Pick<DotacionFilters, 'fechaModo' | 'fecha' | 'fechaDesde' | 'fechaHasta'> => ({
      fechaModo,
      fecha: fechaModo === 'dia' ? filtroFecha : undefined,
      fechaDesde: fechaModo === 'rango' ? filtroFechaDesde : undefined,
      fechaHasta: fechaModo === 'rango' ? filtroFechaHasta : undefined,
    }),
    [fechaModo, filtroFecha, filtroFechaDesde, filtroFechaHasta],
  )

  const activeFilters = useMemo(
    (): DotacionFilters => ({
      finca: filtroFinca,
      tarea: filtroTarea,
      ...fechaFilters,
    }),
    [filtroFinca, filtroTarea, fechaFilters],
  )

  const rowsFiltradas = useMemo(
    () => filterDotacionRows(allRows, activeFilters),
    [allRows, activeFilters],
  )

  const rowsParaResumenFinca = useMemo(() => {
    const porFecha = filterDotacionRowsByFecha(allRows, fechaFilters)
    if (filtroFinca === 'todas') return porFecha
    return porFecha.filter(r => r.finca === filtroFinca)
  }, [allRows, fechaFilters, filtroFinca])

  const resumenPorFinca = useMemo(
    () => computeDotacionPorFincaFromRows(rowsParaResumenFinca),
    [rowsParaResumenFinca],
  )

  const promedioHistorico = useMemo(() => computeDotacionPromedioDiario(partes), [partes])
  const totalFiltrado = computeDotacionTotal(rowsFiltradas)
  const periodoLabel = formatDotacionPeriodoLabel(fechaFilters)

  const handleFechaModoChange = (modo: DotacionFechaModo) => {
    setFechaModo(modo)
    if (modo === 'rango' && fechasDisponibles.length > 0) {
      setFiltroFechaDesde(fechasDisponibles[0])
      setFiltroFechaHasta(fechasDisponibles[fechasDisponibles.length - 1] ?? hoy)
    }
    if (modo === 'dia') {
      setFiltroFecha(hoy)
    }
  }

  return (
    <div className="dotacion-content">
      <div className="dotacion-resumen-grid">
        <div className="dotacion-resumen-card dotacion-resumen-card--total">
          <span className="dotacion-resumen-label">
            Total dotación
            {filtroFinca !== 'todas' ? ` · ${filtroFinca}` : ''}
          </span>
          <strong className="dotacion-resumen-value">{totalFiltrado}</strong>
          <span className="dotacion-resumen-hint">
            personas · {periodoLabel}
            {filtroTarea !== 'todas' ? ` · ${filtroTarea}` : ''}
          </span>
        </div>

        <div className="dotacion-resumen-card dotacion-resumen-card--fincas">
          <span className="dotacion-resumen-label">Por finca</span>
          <DotacionFincaBars items={resumenPorFinca} />
        </div>

        <div className="dotacion-resumen-card dotacion-resumen-card--promedio">
          <span className="dotacion-resumen-label">Promedio histórico</span>
          <strong className="dotacion-resumen-value">{promedioHistorico}</strong>
          <span className="dotacion-resumen-hint">personas / día con actividad</span>
        </div>
      </div>

      <div className="dotacion-filters">
        <label className="dotacion-filter">
          <span>Finca</span>
          <select value={filtroFinca} onChange={e => setFiltroFinca(e.target.value)}>
            <option value="todas">Todas</option>
            {fincasDisponibles.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className="dotacion-filter">
          <span>Período</span>
          <select
            value={fechaModo}
            onChange={e => handleFechaModoChange(e.target.value as DotacionFechaModo)}
          >
            <option value="dia">Un día</option>
            <option value="rango">Rango</option>
            <option value="todas">Todas las fechas</option>
          </select>
        </label>

        {fechaModo === 'dia' && (
          <label className="dotacion-filter">
            <span>Fecha</span>
            <input
              type="date"
              className="dotacion-filter-input"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
            />
          </label>
        )}

        {fechaModo === 'rango' && (
          <>
            <label className="dotacion-filter">
              <span>Desde</span>
              <input
                type="date"
                className="dotacion-filter-input"
                value={filtroFechaDesde}
                onChange={e => setFiltroFechaDesde(e.target.value)}
              />
            </label>
            <label className="dotacion-filter">
              <span>Hasta</span>
              <input
                type="date"
                className="dotacion-filter-input"
                value={filtroFechaHasta}
                onChange={e => setFiltroFechaHasta(e.target.value)}
              />
            </label>
          </>
        )}

        <label className="dotacion-filter">
          <span>Tarea</span>
          <select value={filtroTarea} onChange={e => setFiltroTarea(e.target.value)}>
            <option value="todas">Todas</option>
            {tareasDisponibles.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {rowsFiltradas.length === 0 ? (
        <div className="dashboard-panel-empty dotacion-empty">
          <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p>No hay dotación registrada con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="dotacion-table-wrap">
          <table className="data-table dotacion-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Finca</th>
                <th scope="col">Tarea</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="dotacion-table-num">Personas</th>
              </tr>
            </thead>
            <tbody>
              {rowsFiltradas.map(row => (
                <tr key={row.id}>
                  <td className="dotacion-table-fecha">{row.fechaLabel}</td>
                  <td>{row.finca}</td>
                  <td className="dotacion-table-tarea">{row.tarea}</td>
                  <td>
                    <span className={`dotacion-tipo-badge dotacion-tipo-badge--${row.tipo}`}>
                      {dotacionTipoLabel(row.tipo)}
                    </span>
                  </td>
                  <td className="dotacion-table-num">{row.personas}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="dotacion-table-total-label">
                  Total ({rowsFiltradas.length} {rowsFiltradas.length === 1 ? 'parte' : 'partes'})
                </td>
                <td className="dotacion-table-num dotacion-table-total-value">{totalFiltrado}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
