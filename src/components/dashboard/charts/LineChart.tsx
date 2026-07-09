import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatChartValue } from './chartFormat'

export interface LineChartDataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LineChartDataPoint[]
  height?: number
  lineColor?: string
  fillColor?: string
  unit?: string
}

export default function LineChart({
  data,
  height = 200,
  lineColor = '#16a34a',
  fillColor = 'rgba(34, 197, 94, 0.15)',
  unit,
}: LineChartProps) {
  const chartData = useMemo(
    () => data.map(d => ({ label: d.label, value: d.value })),
    [data],
  )

  const tickInterval = chartData.length > 14 ? Math.ceil(chartData.length / 10) - 1 : 0

  return (
    <div className="chart-line-wrapper" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 16, left: 4, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            interval={tickInterval}
          />
          <YAxis
            tickFormatter={formatChartValue}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={44}
          />
          <Tooltip
            formatter={(value) => [`${formatChartValue(Number(value ?? 0))}${unit ? ` ${unit}` : ''}`, '']}
            labelFormatter={label => String(label)}
            contentStyle={{
              background: 'rgba(0,0,0,.8)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={fillColor}
            dot={{ r: 3.5, fill: '#fff', stroke: lineColor, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
