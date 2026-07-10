import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import type { ParteDeLabores } from '../../types'
import {
  buildDotacionRows,
  computeDotacionPorFinca,
  computeDotacionPromedioDiario,
  computeDotacionTotal,
  filterDotacionRows,
  formatDotacionFechaLabel,
  formatDotacionFincaResumen,
  listDotacionFincas,
  listDotacionTareas,
  localTodayKey,
} from '../../utils/dotacion'

interface Props {
  partes: ParteDeLabores[]
}

export default function DotacionContent({ partes }: Props) {
  const hoy = localTodayKey()
  const allRows = useMemo(() => buildDotacionRows(partes), [partes])
  const fincasDisponibles = useMemo(() => listDotacionFincas(partes), [partes])
  const tareasDisponibles = useMemo(() => listDotacionTareas(partes), [partes])

  const [filtroFinca, setFiltroFinca] = useState('todas')
  const [filtroFecha, setFiltroFecha] = useState(hoy)
  const [filtroTarea, setFiltroTarea] = useState('todas')

  const rowsFiltradas = useMemo(
    () => filterDotacionRows(allRows, { finca: filtroFinca, fecha: filtroFecha, tarea: filtroTarea }),
    [allRows, filtroFinca, filtroFecha, filtroTarea],
  )

  const resumenPorFinca = useMemo(
    () => computeDotacionPorFinca(partes, filtroFecha),
    [partes, filtroFecha],
  )

  const resumenFiltradoFincas = useMemo(() => {
    if (filtroFinca === 'todas') return resumenPorFinca
    return resumenPorFinca.filter(r => r.finca === filtroFinca)
  }, [resumenPorFinca, filtroFinca])

  const promedioHistorico = useMemo(() => computeDotacionPromedioDiario(partes), [partes])
  const totalFiltrado = computeDotacionTotal(rowsFiltradas)

  return (
    <>
      <div className="dotacion-resumen-grid">
        <div className="dotacion-resumen-card">
          <span className="dotacion-resumen-label">
            Dotación {formatDotacionFechaLabel(filtroFecha)}
            {filtroFinca !== 'todas' ? ` · ${filtroFinca}` : ''}
          </span>
          <strong className="dotacion-resumen-value">{totalFiltrado}</strong>
          <span className="dotacion-resumen-hint">personas en la tabla filtrada</span>
        </div>
        <div className="dotacion-resumen-card">
          <span className="dotacion-resumen-label">Por finca</span>
          <p className="dotacion-resumen-fincas">{formatDotacionFincaResumen(resumenFiltradoFincas)}</p>
        </div>
        <div className="dotacion-resumen-card">
          <span className="dotacion-resumen-label">Promedio histórico</span>
          <strong className="dotacion-resumen-value">{promedioHistorico}</strong>
          <span className="dotacion-resumen-hint">personas / día</span>
        </div>
      </div>

      <div className="partes-labores-filters dotacion-filters">
        <label className="partes-labores-filter">
          <span>Finca</span>
          <select value={filtroFinca} onChange={e => setFiltroFinca(e.target.value)}>
            <option value="todas">Todas</option>
            {fincasDisponibles.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="partes-labores-filter">
          <span>Fecha</span>
          <input
            type="date"
            className="form-input dotacion-fecha-input"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
          />
        </label>
        <label className="partes-labores-filter">
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
        <div className="dashboard-panel-empty">
          <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p>No hay dotación registrada con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="metric-modal-table-wrap">
          <table className="data-table metric-modal-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Finca</th>
                <th scope="col">Tarea</th>
                <th scope="col">Personas</th>
              </tr>
            </thead>
            <tbody>
              {rowsFiltradas.map(row => (
                <tr key={row.id}>
                  <td>{row.fechaLabel}</td>
                  <td>{row.finca}</td>
                  <td>{row.tarea}</td>
                  <td>{row.personas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
