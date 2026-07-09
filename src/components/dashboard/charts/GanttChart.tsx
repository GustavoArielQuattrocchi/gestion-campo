import { useMemo } from 'react'
import type { RectangleProps } from 'recharts'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatGanttDate } from './chartFormat'

export interface GanttTask {
  id: string
  label: string
  sublabel?: string
  start: Date
  end: Date
  progress: number
  color?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  height?: number
}

interface GanttRow {
  id: string
  name: string
  sublabel?: string
  offset: number
  duration: number
  progress: number
  color: string
  start: Date
  end: Date
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function GanttBarShape(props: RectangleProps & { payload?: GanttRow }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  if (!payload || width <= 0) return null
  const progressWidth = Math.max(2, width * (payload.progress / 100))
  const barHeight = Math.min(18, height)
  const barY = y + (height - barHeight) / 2
  return (
    <g>
      <rect x={x} y={barY} width={width} height={barHeight} rx={4} fill={payload.color} opacity={0.25} />
      <rect x={x} y={barY} width={progressWidth} height={barHeight} rx={4} fill={payload.color} opacity={0.85} />
    </g>
  )
}

export default function GanttChart({ tasks, height }: GanttChartProps) {
  const { rows, totalDays, minDate } = useMemo(() => {
    if (tasks.length === 0) {
      return { rows: [] as GanttRow[], totalDays: 1, minDate: new Date() }
    }

    let min = tasks[0].start.getTime()
    let max = tasks[0].end.getTime()
    for (const task of tasks) {
      min = Math.min(min, task.start.getTime())
      max = Math.max(max, task.end.getTime())
    }

    const minDate = new Date(min)
    const totalDays = Math.max(1, Math.ceil((max - min) / MS_PER_DAY))

    const rows: GanttRow[] = tasks.map(task => {
      const offset = (task.start.getTime() - min) / MS_PER_DAY
      const duration = Math.max(0.25, (task.end.getTime() - task.start.getTime()) / MS_PER_DAY)
      return {
        id: task.id,
        name: task.label.length > 18 ? `${task.label.slice(0, 17)}…` : task.label,
        sublabel: task.sublabel,
        offset,
        duration,
        progress: task.progress,
        color: task.color ?? '#22c55e',
        start: task.start,
        end: task.end,
      }
    })

    return { rows, totalDays, minDate }
  }, [tasks])

  const chartHeight = height ?? Math.max(160, 48 + rows.length * 36)

  if (rows.length === 0) {
    return (
      <div className="gantt-empty" style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
        No hay tareas con fechas para mostrar.
      </div>
    )
  }

  return (
    <div className="gantt-chart-wrapper" style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, totalDays]}
            tickFormatter={tick => formatGanttDate(new Date(minDate.getTime() + tick * MS_PER_DAY))}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: '#374151' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null
              const row = payload[0].payload as GanttRow
              return (
                <div className="gantt-tooltip">
                  <strong>{row.name}</strong>
                  {row.sublabel && <span className="gantt-tooltip-sub"> — {row.sublabel}</span>}
                  <div>
                    {formatGanttDate(row.start)} → {formatGanttDate(row.end)} · {row.progress.toFixed(0)}%
                  </div>
                </div>
              )
            }}
          />
          <Bar dataKey="offset" stackId="gantt" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="duration"
            stackId="gantt"
            shape={GanttBarShape}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
