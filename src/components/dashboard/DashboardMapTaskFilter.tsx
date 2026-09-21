import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Sprout } from 'lucide-react'
import { localTodayKey } from '../../utils/dotacion'
import {
  MAP_TAREA_TODAS,
  type MapFechaFilter,
  type MapFechaModo,
} from '../../utils/mapTaskFilter'

interface Props {
  filtroTarea: string
  tareasDisponibles: string[]
  filtroFinca: string
  onTareaChange: (value: string) => void
  filtroFecha: MapFechaFilter
  onFechaChange: (value: MapFechaFilter) => void
}

export default function DashboardMapTaskFilter({
  filtroTarea,
  tareasDisponibles,
  filtroFinca,
  onTareaChange,
  filtroFecha,
  onFechaChange,
}: Props) {
  const [dateOpen, setDateOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hoy = localTodayKey()
  const laborActiva = filtroTarea !== MAP_TAREA_TODAS
  const fechaActiva = filtroFecha.modo !== 'dia' || filtroFecha.fecha !== hoy
  const selectTitle = laborActiva
    ? `${filtroFinca !== 'todas' ? `${filtroFinca} · ` : ''}Solo cuadros con «${filtroTarea}»`
    : 'Mostrar todas las labores en el mapa'

  useEffect(() => {
    if (!dateOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setDateOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [dateOpen])

  const handleModoChange = (modo: MapFechaModo) => {
    if (modo === 'dia') {
      onFechaChange({
        modo: 'dia',
        fecha: filtroFecha.fecha ?? filtroFecha.desde ?? hoy,
      })
      return
    }
    if (modo === 'rango') {
      const ancla = filtroFecha.fecha ?? filtroFecha.desde ?? hoy
      onFechaChange({
        modo: 'rango',
        desde: filtroFecha.desde ?? ancla,
        hasta: filtroFecha.hasta ?? filtroFecha.fecha ?? ancla,
      })
      return
    }
    onFechaChange({ modo: 'todas' })
  }

  return (
    <div
      ref={rootRef}
      className={`dashboard-map-task-filter ${laborActiva ? 'is-active' : ''} ${fechaActiva ? 'has-custom-date' : ''}`}
      role="group"
      aria-label="Filtrar labor y fecha en el mapa"
      title={selectTitle}
    >
      <span className="dashboard-map-task-filter-icon" aria-hidden>
        <Sprout size={18} />
      </span>
      <div className="dashboard-map-task-filter-content dashboard-map-task-filter-labor">
        <strong>Labor en mapa</strong>
        <select
          id="dashboard-map-task-select"
          className="dashboard-map-task-filter-select"
          value={filtroTarea}
          onChange={e => onTareaChange(e.target.value)}
          title={selectTitle}
          aria-label="Labor en mapa"
        >
          <option value={MAP_TAREA_TODAS}>Todas las labores</option>
          {tareasDisponibles.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <span className="dashboard-map-task-filter-divider" aria-hidden />

      <button
        type="button"
        className="dashboard-map-task-filter-icon dashboard-map-task-filter-date-toggle"
        aria-label="Fecha en mapa"
        aria-expanded={dateOpen}
        onClick={() => setDateOpen(open => !open)}
      >
        <CalendarDays size={18} />
      </button>

      <div className={`dashboard-map-task-filter-date-panel ${dateOpen ? 'is-open' : ''}`}>
        <strong>Fecha en mapa</strong>
        <div className="dashboard-map-task-filter-date-row">
          <select
            className="dashboard-map-task-filter-select"
            value={filtroFecha.modo}
            onChange={e => handleModoChange(e.target.value as MapFechaModo)}
            aria-label="Período en mapa"
          >
            <option value="dia">Un día</option>
            <option value="rango">Rango</option>
            <option value="todas">Todas las fechas</option>
          </select>
          {filtroFecha.modo === 'dia' && (
            <input
              type="date"
              className="dashboard-map-task-filter-date-input"
              value={filtroFecha.fecha ?? hoy}
              onChange={e => onFechaChange({ modo: 'dia', fecha: e.target.value || hoy })}
              aria-label="Día en mapa"
            />
          )}
          {filtroFecha.modo === 'rango' && (
            <>
              <input
                type="date"
                className="dashboard-map-task-filter-date-input"
                value={filtroFecha.desde ?? hoy}
                onChange={e => onFechaChange({
                  modo: 'rango',
                  desde: e.target.value || hoy,
                  hasta: filtroFecha.hasta ?? hoy,
                })}
                aria-label="Desde"
              />
              <input
                type="date"
                className="dashboard-map-task-filter-date-input"
                value={filtroFecha.hasta ?? hoy}
                onChange={e => onFechaChange({
                  modo: 'rango',
                  desde: filtroFecha.desde ?? hoy,
                  hasta: e.target.value || hoy,
                })}
                aria-label="Hasta"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
