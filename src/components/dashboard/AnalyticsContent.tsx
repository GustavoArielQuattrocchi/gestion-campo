import { useEffect, useMemo, useState } from 'react'
import type { Tarea, ParteDeLabores } from '../../types'
import {
  computeDailyProductivity,
  computeDailyStaffing,
  computeCumulativeProgress,
  computeAnalyticsKPIs,
  chartTotalsByDay,
  chartRatiosByDay,
  listProductivityUnits,
  listRatioUnits,
  formatTotalsCell,
  formatRatiosCell,
  listTareasPorRecencia,
  filterRowsByTarea,
  filterTareasByNombre,
  filterPartesByNombre,
  TAREA_FILTRO_TODAS,
} from '../../utils/analyticsAggregations'
import { aggregateStaffingFromPartes } from '../../utils/dotacion'
import { computeTareaProgress } from '../../utils/tareaProgress'
import BarChart from './charts/BarChart'
import LineChart from './charts/LineChart'
import GanttChart, { type GanttTask } from './charts/GanttChart'

type TabKey = 'productividad' | 'dotacion' | 'avance' | 'indicadores' | 'timeline'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'productividad', label: 'Productividad' },
  { key: 'dotacion', label: 'Dotación' },
  { key: 'avance', label: 'Avance' },
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'timeline', label: 'Timeline' },
]

interface Props {
  tareas: Tarea[]
  partes: ParteDeLabores[]
  partesStaffing?: ParteDeLabores[]
}

function TareaSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      className="analytics-unit-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Tarea"
      title="Tarea"
    >
      <option value={TAREA_FILTRO_TODAS}>Todas las labores</option>
      {options.map(nombre => (
        <option key={nombre} value={nombre}>
          {nombre}
        </option>
      ))}
    </select>
  )
}

export default function AnalyticsContent({ tareas, partes, partesStaffing }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('productividad')
  const [selectedUnit, setSelectedUnit] = useState<string>('hileras')
  const [selectedRatioUnit, setSelectedRatioUnit] = useState<string>('hileras')

  const [tareaTotales, setTareaTotales] = useState(TAREA_FILTRO_TODAS)
  const [tareaRatio, setTareaRatio] = useState(TAREA_FILTRO_TODAS)
  const [tareaDetalle, setTareaDetalle] = useState(TAREA_FILTRO_TODAS)
  const [tareaPromedio, setTareaPromedio] = useState(TAREA_FILTRO_TODAS)
  const [tareaDotacion, setTareaDotacion] = useState(TAREA_FILTRO_TODAS)
  const [tareaRendPersona, setTareaRendPersona] = useState(TAREA_FILTRO_TODAS)
  const [tareaAvance, setTareaAvance] = useState(TAREA_FILTRO_TODAS)
  const [tareaAvanceFinca, setTareaAvanceFinca] = useState(TAREA_FILTRO_TODAS)
  const [tareaKpis, setTareaKpis] = useState(TAREA_FILTRO_TODAS)
  const [tareaDias, setTareaDias] = useState(TAREA_FILTRO_TODAS)
  const [tareaMaquinaria, setTareaMaquinaria] = useState(TAREA_FILTRO_TODAS)
  const [tareaTimeline, setTareaTimeline] = useState(TAREA_FILTRO_TODAS)

  const tareasOpciones = useMemo(
    () => listTareasPorRecencia(tareas, partes),
    [tareas, partes],
  )

  const dailyProd = useMemo(() => computeDailyProductivity(tareas, partes), [tareas, partes])

  const dailyProdTotales = useMemo(
    () => filterRowsByTarea(dailyProd, tareaTotales),
    [dailyProd, tareaTotales],
  )
  const dailyProdRatio = useMemo(
    () => filterRowsByTarea(dailyProd, tareaRatio),
    [dailyProd, tareaRatio],
  )
  const dailyProdDetalle = useMemo(
    () => filterRowsByTarea(dailyProd, tareaDetalle),
    [dailyProd, tareaDetalle],
  )

  const availableUnits = useMemo(
    () => listProductivityUnits(dailyProdTotales),
    [dailyProdTotales],
  )
  const ratioUnits = useMemo(() => listRatioUnits(dailyProdRatio), [dailyProdRatio])

  useEffect(() => {
    if (availableUnits.length === 0) return
    if (!availableUnits.includes(selectedUnit)) {
      setSelectedUnit(availableUnits.includes('hileras') ? 'hileras' : availableUnits[0])
    }
  }, [availableUnits, selectedUnit])

  useEffect(() => {
    if (ratioUnits.length === 0) return
    if (!ratioUnits.includes(selectedRatioUnit)) {
      setSelectedRatioUnit(ratioUnits.includes('hileras') ? 'hileras' : ratioUnits[0])
    }
  }, [ratioUnits, selectedRatioUnit])

  const prodChartData = useMemo(
    () => chartTotalsByDay(dailyProdTotales, selectedUnit),
    [dailyProdTotales, selectedUnit],
  )

  const ratioChartData = useMemo(
    () => chartRatiosByDay(dailyProdRatio, selectedRatioUnit),
    [dailyProdRatio, selectedRatioUnit],
  )

  const dailyStaff = useMemo(() => {
    const staffingPartes = filterPartesByNombre(partesStaffing ?? partes, tareaDotacion)
    const fromPartes = aggregateStaffingFromPartes(staffingPartes)
    if (fromPartes.length > 0) {
      return fromPartes.map(d => ({
        fecha: d.fecha,
        label: d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7),
        personas: d.personas,
        tareas: d.tareas,
        fincas: [] as string[],
      }))
    }
    return computeDailyStaffing(filterTareasByNombre(tareas, tareaDotacion))
  }, [tareas, partes, partesStaffing, tareaDotacion])

  const progress = useMemo(
    () => computeCumulativeProgress(filterTareasByNombre(tareas, tareaAvance)),
    [tareas, tareaAvance],
  )

  const kpisPromedio = useMemo(
    () => computeAnalyticsKPIs(tareas, filterPartesByNombre(partes, tareaPromedio)),
    [tareas, partes, tareaPromedio],
  )

  const kpisRendPersona = useMemo(
    () => computeAnalyticsKPIs(tareas, filterPartesByNombre(partes, tareaRendPersona)),
    [tareas, partes, tareaRendPersona],
  )

  const kpisAvanceFinca = useMemo(
    () =>
      computeAnalyticsKPIs(
        filterTareasByNombre(tareas, tareaAvanceFinca),
        filterPartesByNombre(partes, tareaAvanceFinca),
      ),
    [tareas, partes, tareaAvanceFinca],
  )

  const kpisCards = useMemo(
    () =>
      computeAnalyticsKPIs(
        filterTareasByNombre(tareas, tareaKpis),
        filterPartesByNombre(partes, tareaKpis),
      ),
    [tareas, partes, tareaKpis],
  )

  const kpisDias = useMemo(
    () =>
      computeAnalyticsKPIs(
        filterTareasByNombre(tareas, tareaDias),
        filterPartesByNombre(partes, tareaDias),
      ),
    [tareas, partes, tareaDias],
  )

  const kpisMaquinaria = useMemo(
    () =>
      computeAnalyticsKPIs(
        filterTareasByNombre(tareas, tareaMaquinaria),
        filterPartesByNombre(partes, tareaMaquinaria),
      ),
    [tareas, partes, tareaMaquinaria],
  )

  const ganttTasks: GanttTask[] = useMemo(
    () =>
      filterTareasByNombre(tareas, tareaTimeline)
        .filter(t => t.fechaInicio?.toDate)
        .map(t => ({
          id: t.id,
          label: t.tarea,
          sublabel: t.fincaNombre,
          start: t.fechaInicio.toDate(),
          end: t.fechaFin?.toDate() ?? new Date(),
          progress: computeTareaProgress(t).porcentaje,
          color: t.estado === 'finalizada' ? '#9ca3af' : '#22c55e',
        })),
    [tareas, tareaTimeline],
  )

  const staffChartData = useMemo(
    () => dailyStaff.map(d => ({ label: d.label, value: d.personas })),
    [dailyStaff],
  )

  const progressChartData = useMemo(
    () => progress.map(d => ({ label: d.label, value: d.hectareasAcumuladas })),
    [progress],
  )

  return (
    <div className="analytics-content">
      <div className="analytics-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`analytics-tab ${activeTab === tab.key ? 'analytics-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="analytics-panel">
        {activeTab === 'productividad' && (
          <>
            <div className="analytics-chart-header">
              <h4>Rendimiento diario</h4>
              <div className="analytics-chart-filters">
                <TareaSelect
                  value={tareaTotales}
                  options={tareasOpciones}
                  onChange={setTareaTotales}
                />
                {availableUnits.length > 1 && (
                  <select
                    className="analytics-unit-select"
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                    aria-label="Unidad"
                  >
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {prodChartData.length > 0 ? (
              <BarChart data={prodChartData} unit={selectedUnit} barColor="#22c55e" />
            ) : (
              <p className="analytics-empty">No hay datos de rendimiento numérico aún.</p>
            )}

            <div className="analytics-chart-header" style={{ marginTop: 20 }}>
              <h4>Rendimiento por jornal</h4>
              <div className="analytics-chart-filters">
                <TareaSelect
                  value={tareaRatio}
                  options={tareasOpciones}
                  onChange={setTareaRatio}
                />
                {ratioUnits.length > 1 && (
                  <select
                    className="analytics-unit-select"
                    value={selectedRatioUnit}
                    onChange={e => setSelectedRatioUnit(e.target.value)}
                    aria-label="Unidad ratio"
                  >
                    {ratioUnits.map(u => (
                      <option key={u} value={u}>{u}/jornal</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {ratioChartData.length > 0 ? (
              <BarChart
                data={ratioChartData}
                unit={`${selectedRatioUnit}/jornal`}
                barColor="#8b5cf6"
              />
            ) : (
              <p className="analytics-empty">
                No hay datos para calcular rendimiento por jornal con la selección actual.
              </p>
            )}

            <div className="analytics-kpi-table">
              <div className="analytics-chart-header">
                <h4>Detalle por día y labor</h4>
                <TareaSelect
                  value={tareaDetalle}
                  options={tareasOpciones}
                  onChange={setTareaDetalle}
                />
              </div>
              {dailyProdDetalle.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Labor</th>
                      <th>Totales</th>
                      <th>Jornales</th>
                      <th>Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyProdDetalle.map(row => (
                      <tr key={`${row.fecha}|${row.tarea}`}>
                        <td>{row.label}</td>
                        <td>{row.tarea}</td>
                        <td>{formatTotalsCell(row.totalByUnit)}</td>
                        <td className="num">{row.jornalesTotales.toFixed(1)}</td>
                        <td>{formatRatiosCell(row.ratioByUnit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin filas para la tarea seleccionada.</p>
              )}
            </div>

            <div className="analytics-kpi-table">
              <div className="analytics-chart-header">
                <h4>Rendimiento promedio por labor</h4>
                <TareaSelect
                  value={tareaPromedio}
                  options={tareasOpciones}
                  onChange={setTareaPromedio}
                />
              </div>
              {kpisPromedio.rendimientoPromedioPorLabor.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Promedio</th><th>Unidad</th><th>Partes</th></tr>
                  </thead>
                  <tbody>
                    {kpisPromedio.rendimientoPromedioPorLabor.map(r => (
                      <tr key={`${r.tarea}-${r.unidad}`}>
                        <td>{r.tarea}</td>
                        <td className="num">{r.promedio.toFixed(1)}</td>
                        <td>{r.unidad}</td>
                        <td className="num">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin datos de promedio para la tarea seleccionada.</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'dotacion' && (
          <>
            <div className="analytics-chart-header">
              <h4>Personas por día</h4>
              <TareaSelect
                value={tareaDotacion}
                options={tareasOpciones}
                onChange={setTareaDotacion}
              />
            </div>
            {staffChartData.length > 0 ? (
              <BarChart data={staffChartData} unit="personas" barColor="#3b82f6" />
            ) : (
              <p className="analytics-empty">No hay datos de dotación aún.</p>
            )}

            <div className="analytics-kpi-table">
              <div className="analytics-chart-header">
                <h4>Rendimiento por persona</h4>
                <TareaSelect
                  value={tareaRendPersona}
                  options={tareasOpciones}
                  onChange={setTareaRendPersona}
                />
              </div>
              {kpisRendPersona.rendimientoPorPersona.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Rend. / persona</th><th>Unidad</th></tr>
                  </thead>
                  <tbody>
                    {kpisRendPersona.rendimientoPorPersona.map(r => (
                      <tr key={r.tarea}>
                        <td>{r.tarea}</td>
                        <td className="num">{r.valor.toFixed(1)}</td>
                        <td>{r.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin datos para la tarea seleccionada.</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'avance' && (
          <>
            <div className="analytics-chart-header">
              <h4>Avance acumulado (ha)</h4>
              <TareaSelect
                value={tareaAvance}
                options={tareasOpciones}
                onChange={setTareaAvance}
              />
            </div>
            {progressChartData.length > 0 ? (
              <LineChart
                data={progressChartData}
                unit="ha"
                lineColor="#16a34a"
                fillColor="rgba(34, 197, 94, 0.15)"
              />
            ) : (
              <p className="analytics-empty">No hay datos de avance acumulado aún.</p>
            )}

            <div className="analytics-kpi-table">
              <div className="analytics-chart-header">
                <h4>Avance por finca</h4>
                <TareaSelect
                  value={tareaAvanceFinca}
                  options={tareasOpciones}
                  onChange={setTareaAvanceFinca}
                />
              </div>
              {kpisAvanceFinca.avancePorFinca.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Finca</th><th>Ha finalizadas</th><th>Ha totales</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {kpisAvanceFinca.avancePorFinca.map(f => (
                      <tr key={f.finca}>
                        <td>{f.finca}</td>
                        <td className="num">{f.hectareasFinalizadas.toFixed(1)}</td>
                        <td className="num">{f.hectareasTotales.toFixed(1)}</td>
                        <td className="num">
                          <span className="analytics-pct">{f.porcentaje.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin avance por finca para la tarea seleccionada.</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'indicadores' && (
          <div className="analytics-kpis-grid">
            <div className="analytics-chart-header" style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ margin: 0, fontSize: 13 }}>Resumen</h4>
              <TareaSelect
                value={tareaKpis}
                options={tareasOpciones}
                onChange={setTareaKpis}
              />
            </div>
            <div className="analytics-kpi-card">
              <span className="analytics-kpi-value">{kpisCards.operadoresActivos}</span>
              <span className="analytics-kpi-label">Operadores activos</span>
            </div>
            <div className="analytics-kpi-card">
              <span className="analytics-kpi-value">{kpisCards.partesPorDia.toFixed(1)}</span>
              <span className="analytics-kpi-label">Partes / día</span>
            </div>

            <div className="analytics-kpi-table" style={{ gridColumn: '1 / -1' }}>
              <div className="analytics-chart-header">
                <h4>Días promedio para completar labor</h4>
                <TareaSelect
                  value={tareaDias}
                  options={tareasOpciones}
                  onChange={setTareaDias}
                />
              </div>
              {kpisDias.diasParaCompletar.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Días promedio</th><th>Tareas</th></tr>
                  </thead>
                  <tbody>
                    {kpisDias.diasParaCompletar.map(d => (
                      <tr key={d.tarea}>
                        <td>{d.tarea}</td>
                        <td className="num">{d.diasPromedio.toFixed(1)}</td>
                        <td className="num">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin datos para la tarea seleccionada.</p>
              )}
            </div>

            <div className="analytics-kpi-table" style={{ gridColumn: '1 / -1' }}>
              <div className="analytics-chart-header">
                <h4>Utilización de maquinaria</h4>
                <TareaSelect
                  value={tareaMaquinaria}
                  options={tareasOpciones}
                  onChange={setTareaMaquinaria}
                />
              </div>
              {kpisMaquinaria.utilizacionMaquinaria.length > 0 ? (
                <table>
                  <thead>
                    <tr><th>Maquinaria</th><th>Modelo</th><th>Partes</th></tr>
                  </thead>
                  <tbody>
                    {kpisMaquinaria.utilizacionMaquinaria.map(m => (
                      <tr key={`${m.maquinaria}-${m.modelo}`}>
                        <td>{m.maquinaria}</td>
                        <td>{m.modelo ?? '—'}</td>
                        <td className="num">{m.partes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="analytics-empty">Sin maquinaria para la tarea seleccionada.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <>
            <div className="analytics-chart-header">
              <h4>Cronograma de labores</h4>
              <TareaSelect
                value={tareaTimeline}
                options={tareasOpciones}
                onChange={setTareaTimeline}
              />
            </div>
            <GanttChart tasks={ganttTasks} />
          </>
        )}
      </div>
    </div>
  )
}
