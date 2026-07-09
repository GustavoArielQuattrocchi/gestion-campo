import { useEffect, useRef, useState } from 'react'
import { ChevronDown, CloudSun } from 'lucide-react'
import { useFincaForecasts } from '../../hooks/useFincaForecasts'
import { getWeatherEmoji, weatherCodeToLabel } from '../../utils/weatherService'
import WeatherForecastContent from './WeatherForecastContent'

interface Props {
  filtroFinca: string
}

export default function DashboardWeatherFloat({ filtroFinca }: Props) {
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const { forecasts, loading, error, showFincaTitle } = useFincaForecasts(filtroFinca)

  const today = forecasts[0]?.days[0]

  useEffect(() => {
    if (!expanded) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        setExpanded(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  const summary = today
    ? `${weatherCodeToLabel(today.weatherCode)} · ${today.temperatureMin}° / ${today.temperatureMax}°`
    : 'Ver pronóstico'

  return (
    <aside
      ref={panelRef}
      className={`dashboard-weather-float ${expanded ? 'is-expanded' : 'is-collapsed'}`}
      aria-label="Pronóstico del tiempo"
    >
      <button
        type="button"
        className="dashboard-weather-float-toggle"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-controls="dashboard-weather-panel"
        title={expanded ? 'Ocultar pronóstico' : 'Mostrar pronóstico'}
      >
        <span className="dashboard-weather-float-toggle-icon" aria-hidden>
          {today ? (
            <span className="dashboard-weather-float-emoji">{getWeatherEmoji(today.weatherCode)}</span>
          ) : (
            <CloudSun size={18} />
          )}
        </span>
        <span className="dashboard-weather-float-toggle-text">
          <strong>Pronóstico</strong>
          <small>{loading ? 'Cargando…' : summary}</small>
        </span>
        <ChevronDown
          size={16}
          className={`dashboard-weather-float-chevron ${expanded ? 'is-open' : ''}`}
          aria-hidden
        />
      </button>

      <div
        id="dashboard-weather-panel"
        className="dashboard-weather-float-body"
        hidden={!expanded}
      >
        <div className="dashboard-weather-float-body-head">
          <span>Próximos 3 días</span>
          {filtroFinca !== 'todas' && <span className="dashboard-weather-float-finca-tag">{filtroFinca}</span>}
        </div>
        <WeatherForecastContent
          forecasts={forecasts}
          loading={loading}
          error={error}
          showFincaTitle={showFincaTitle}
        />
      </div>
    </aside>
  )
}
