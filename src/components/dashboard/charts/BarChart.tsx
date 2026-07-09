import { useMemo } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import { formatChartValue } from './chartFormat'

export interface BarChartDataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartDataPoint[]
  height?: number
  barColor?: string
  unit?: string
  maxBars?: number
}

export default function BarChart({
  data,
  height = 200,
  barColor = '#22c55e',
  unit,
  maxBars = 14,
}: BarChartProps) {
  const chartData = useMemo(() => {
    const visible = data.length > maxBars ? data.slice(-maxBars) : data
    return visible.map(d => ({
      label: d.label,
      value: d.value,
      fill: d.color ?? barColor,
    }))
  }, [data, maxBars, barColor])

  const rotateLabels = chartData.length > 8

  return (
    <div className="chart-bar-wrapper" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={chartData} margin={{ top: 20, right: 12, left: 4, bottom: rotateLabels ? 48 : 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={rotateLabels ? -35 : 0}
            textAnchor={rotateLabels ? 'end' : 'middle'}
            interval={0}
            height={rotateLabels ? 56 : 32}
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
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={label => formatChartValue(Number(label))}
              style={{ fontSize: 10, fontWeight: 600, fill: '#374151' }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
