import { useMemo, useState } from 'react'
import type { Tarea, ParteDeLabores } from '../../types'
import {
  computeDailyProductivity,
  computeDailyStaffing,
  computeCumulativeProgress,
  computeAnalyticsKPIs,
} from '../../utils/analyticsAggregations'
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
}

export default function AnalyticsContent({ tareas, partes }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('productividad')
  const [selectedUnit, setSelectedUnit] = useState<string>('hileras')

  const dailyProd = useMemo(() => computeDailyProductivity(tareas), [tareas])
  const dailyStaff = useMemo(() => computeDailyStaffing(tareas), [tareas])
  const progress = useMemo(() => computeCumulativeProgress(tareas), [tareas])
  const kpis = useMemo(() => computeAnalyticsKPIs(tareas, partes), [tareas, partes])

  const ganttTasks: GanttTask[] = useMemo(
    () =>
      tareas
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
    [tareas],
  )

  const availableUnits = useMemo(() => {
    const units = new Set<string>()
    for (const day of dailyProd) {
      for (const u of Object.keys(day.totalByUnit)) units.add(u)
    }
    return [...units].sort()
  }, [dailyProd])

  const prodChartData = useMemo(
    () =>
      dailyProd
        .filter(d => (d.totalByUnit[selectedUnit] ?? 0) > 0)
        .map(d => ({
          label: d.label,
          value: d.totalByUnit[selectedUnit] ?? 0,
        })),
    [dailyProd, selectedUnit],
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
              {availableUnits.length > 1 && (
                <select
                  className="analytics-unit-select"
                  value={selectedUnit}
                  onChange={e => setSelectedUnit(e.target.value)}
                >
                  {availableUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              )}
            </div>
            {prodChartData.length > 0 ? (
              <BarChart data={prodChartData} unit={selectedUnit} barColor="#22c55e" />
            ) : (
              <p className="analytics-empty">No hay datos de rendimiento numérico aún.</p>
            )}

            {kpis.rendimientoPromedioPorLabor.length > 0 && (
              <div className="analytics-kpi-table">
                <h4>Rendimiento promedio por labor</h4>
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Promedio</th><th>Unidad</th><th>Partes</th></tr>
                  </thead>
                  <tbody>
                    {kpis.rendimientoPromedioPorLabor.map(r => (
                      <tr key={`${r.tarea}-${r.unidad}`}>
                        <td>{r.tarea}</td>
                        <td className="num">{r.promedio.toFixed(1)}</td>
                        <td>{r.unidad}</td>
                        <td className="num">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'dotacion' && (
          <>
            <h4>Personas por día</h4>
            {staffChartData.length > 0 ? (
              <BarChart data={staffChartData} unit="personas" barColor="#3b82f6" />
            ) : (
              <p className="analytics-empty">No hay datos de dotación aún.</p>
            )}

            {kpis.rendimientoPorPersona.length > 0 && (
              <div className="analytics-kpi-table">
                <h4>Rendimiento por persona</h4>
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Rend. / persona</th><th>Unidad</th></tr>
                  </thead>
                  <tbody>
                    {kpis.rendimientoPorPersona.map(r => (
                      <tr key={r.tarea}>
                        <td>{r.tarea}</td>
                        <td className="num">{r.valor.toFixed(1)}</td>
                        <td>{r.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'avance' && (
          <>
            <h4>Avance acumulado (ha)</h4>
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

            {kpis.avancePorFinca.length > 0 && (
              <div className="analytics-kpi-table">
                <h4>Avance por finca</h4>
                <table>
                  <thead>
                    <tr><th>Finca</th><th>Ha finalizadas</th><th>Ha totales</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {kpis.avancePorFinca.map(f => (
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
              </div>
            )}
          </>
        )}

        {activeTab === 'indicadores' && (
          <div className="analytics-kpis-grid">
            <div className="analytics-kpi-card">
              <span className="analytics-kpi-value">{kpis.operadoresActivos}</span>
              <span className="analytics-kpi-label">Operadores activos</span>
            </div>
            <div className="analytics-kpi-card">
              <span className="analytics-kpi-value">{kpis.partesPorDia.toFixed(1)}</span>
              <span className="analytics-kpi-label">Partes / día</span>
            </div>

            {kpis.diasParaCompletar.length > 0 && (
              <div className="analytics-kpi-table" style={{ gridColumn: '1 / -1' }}>
                <h4>Días promedio para completar labor</h4>
                <table>
                  <thead>
                    <tr><th>Labor</th><th>Días promedio</th><th>Tareas</th></tr>
                  </thead>
                  <tbody>
                    {kpis.diasParaCompletar.map(d => (
                      <tr key={d.tarea}>
                        <td>{d.tarea}</td>
                        <td className="num">{d.diasPromedio.toFixed(1)}</td>
                        <td className="num">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {kpis.utilizacionMaquinaria.length > 0 && (
              <div className="analytics-kpi-table" style={{ gridColumn: '1 / -1' }}>
                <h4>Utilización de maquinaria</h4>
                <table>
                  <thead>
                    <tr><th>Maquinaria</th><th>Modelo</th><th>Partes</th></tr>
                  </thead>
                  <tbody>
                    {kpis.utilizacionMaquinaria.map(m => (
                      <tr key={`${m.maquinaria}-${m.modelo}`}>
                        <td>{m.maquinaria}</td>
                        <td>{m.modelo ?? '—'}</td>
                        <td className="num">{m.partes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <>
            <h4>Cronograma de labores</h4>
            <GanttChart tasks={ganttTasks} />
          </>
        )}
      </div>
    </div>
  )
}
