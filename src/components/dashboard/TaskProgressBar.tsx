interface Props {
  value: number
  label?: string
  compact?: boolean
}

export default function TaskProgressBar({ value, label, compact = false }: Props) {
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className={`task-progress${compact ? ' task-progress--compact' : ''}`}>
      <div className="task-progress-header">
        <span className="task-progress-label">{label ?? 'Avance'}</span>
        <span className="task-progress-pct">{pct}%</span>
      </div>
      <div className="task-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="task-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
