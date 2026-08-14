import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import type { InformeAccidente } from '../../hooks/useInformesAccidente'
import {
  countAccidentesPorFinca,
  countNaturalezasLesion,
  countPartesCuerpo,
  filterInformesCompletos,
  formatYearMonthLabel,
  listYearMonths,
  rankAfectados,
  yearMonthKey,
} from '../../utils/accidentAnalytics'
import type { InformeAccidenteCompleto } from '../../utils/parseInformeAccidente'
import {
  accidentReportFileName,
  buildAccidentReportPdf,
  downloadBlob,
} from '../../utils/buildAccidentReportPdf'
import { formatTimestamp } from '../../utils/formatTimestamp'
import BarChart from './charts/BarChart'

interface Props {
  informes: InformeAccidente[]
  loading: boolean
  error: string | null
  fincasDisponibles: string[]
}

function downloadInformePdf(informe: InformeAccidenteCompleto) {
  const fecha = informe.creadoEn.toDate()
  const blob = buildAccidentReportPdf({
    operador: informe.operador,
    fincaNombre: informe.fincaNombre,
    tipo: informe.tipo,
    tarea: informe.tarea,
    afectadoNombre: informe.afectadoNombre,
    afectadoDni: informe.afectadoDni,
    partesCuerpo: informe.partesCuerpo,
    parteCuerpoOtro: informe.parteCuerpoOtro,
    naturalezasLesion: informe.naturalezasLesion,
    naturalezaLesionOtro: informe.naturalezaLesionOtro,
    descripcion: informe.descripcion,
    fecha,
  })
  downloadBlob(blob, accidentReportFileName(informe.fincaNombre, fecha, informe.afectadoDni))
}

export default function SafetyContent({
  informes,
  loading,
  error,
  fincasDisponibles,
}: Props) {
  const months = useMemo(() => listYearMonths(informes), [informes])
  const [filtroFinca, setFiltroFinca] = useState('todas')
  const [filtroMes, setFiltroMes] = useState(() => yearMonthKey(new Date()))

  const completos = useMemo(
    () => filterInformesCompletos(informes, filtroFinca, filtroMes),
    [informes, filtroFinca, filtroMes],
  )

  const porFinca = useMemo(() => countAccidentesPorFinca(completos), [completos])
  const porParte = useMemo(() => countPartesCuerpo(completos), [completos])
  const porNaturaleza = useMemo(() => countNaturalezasLesion(completos), [completos])
  const ranking = useMemo(() => rankAfectados(completos), [completos])
  const topPersona = ranking.find(r => r.isTop)

  const sorted = useMemo(
    () => [...completos].sort((a, b) => b.creadoEn.toDate().getTime() - a.creadoEn.toDate().getTime()),
    [completos],
  )

  if (loading) {
    return <p className="dashboard-panel-empty">Cargando informes de accidentes...</p>
  }

  if (error) {
    return <p className="dashboard-panel-empty dashboard-panel-empty--error">{error}</p>
  }

  return (
    <>
      <div className="partes-labores-filters">
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
          <span>Mes</span>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            {months.map(m => (
              <option key={m} value={m}>{formatYearMonthLabel(m)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="safety-kpis">
        <div className="safety-kpi">
          <div className="safety-kpi-value">{completos.length}</div>
          <div className="safety-kpi-label">Accidentes del período</div>
        </div>
        <div className="safety-kpi">
          <div className="safety-kpi-value">{ranking.length}</div>
          <div className="safety-kpi-label">Personas afectadas</div>
        </div>
        <div className={`safety-kpi${topPersona ? ' safety-kpi--alert' : ''}`}>
          <div className="safety-kpi-value" style={{ fontSize: topPersona ? 16 : 24 }}>
            {topPersona ? topPersona.nombre : '—'}
          </div>
          <div className="safety-kpi-label">
            {topPersona ? `Más accidentado · ${topPersona.count} informes` : 'Sin reiteraciones'}
          </div>
        </div>
      </div>

      {completos.length === 0 ? (
        <p className="dashboard-panel-empty">
          No hay informes completos en este mes. Los gráficos usan el formulario nuevo (afectado, DNI y checklist).
        </p>
      ) : (
        <>
          <div className="analytics-chart-header">
            <h4>Accidentes por finca</h4>
          </div>
          {porFinca.length > 0 ? (
            <BarChart data={porFinca.slice(0, 12)} unit="acc." barColor="#ef4444" maxBars={12} height={220} />
          ) : (
            <p className="analytics-empty">Sin datos para este filtro.</p>
          )}

          <div className="analytics-chart-header" style={{ marginTop: 20 }}>
            <h4>Partes del cuerpo lastimadas</h4>
          </div>
          {porParte.length > 0 ? (
            <BarChart data={porParte.slice(0, 16)} unit="" barColor="#ef4444" maxBars={16} height={240} />
          ) : (
            <p className="analytics-empty">Sin datos para este filtro.</p>
          )}

          <div className="analytics-chart-header" style={{ marginTop: 20 }}>
            <h4>Naturaleza de la lesión</h4>
          </div>
          {porNaturaleza.length > 0 ? (
            <BarChart data={porNaturaleza.slice(0, 16)} unit="" barColor="#ef4444" maxBars={16} height={240} />
          ) : (
            <p className="analytics-empty">Sin datos para este filtro.</p>
          )}

          <div className="analytics-kpi-table" style={{ marginTop: 28 }}>
            <h4>Ranking de afectados</h4>
            <p className="safety-rank-hint">
              Agrupado por DNI. Se resalta quien tiene más de un accidente en el período.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Accidentes</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(row => (
                  <tr key={row.dni} className={row.isTop ? 'safety-rank-row--top' : undefined}>
                    <td>
                      {row.nombre}
                      {row.isTop && <span className="safety-rank-badge">Más accidentado</span>}
                    </td>
                    <td>{row.dni}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="safety-list-title">Informes</h4>
          <ul className="safety-timeline">
            {sorted.map(informe => (
              <li key={informe.id} className="safety-item">
                <div className="safety-item-date">
                  {formatTimestamp(informe.creadoEn, 'dd/MM/yy')}
                </div>
                <div className="safety-item-body">
                  <div className="safety-item-header">
                    <strong>{informe.afectadoNombre}</strong>
                    <span className="safety-item-finca">{informe.fincaNombre}</span>
                    <span className="safety-item-finca">DNI {informe.afectadoDni}</span>
                  </div>
                  <p className="safety-item-desc">
                    {informe.tarea} · {informe.descripcion}
                  </p>
                  <button
                    type="button"
                    className="btn-ghost safety-pdf-btn"
                    onClick={() => downloadInformePdf(informe)}
                  >
                    <Download size={14} /> Descargar PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
