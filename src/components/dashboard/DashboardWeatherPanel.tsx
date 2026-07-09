import { useEffect, useMemo, useState } from 'react'
import { CloudSun } from 'lucide-react'
import {
  fetchForecast,
  formatForecastDayLabel,
  getWeatherEmoji,
  listFincasConClima,
  weatherCodeToLabel,
} from '../../utils/weatherService'
import type { DayForecast } from '../../utils/weatherService'
import DashboardPanel from './DashboardPanel'

interface Props {
  open: boolean
  onToggle: () => void
  filtroFinca: string
}

interface FincaForecast {
  fincaId: string
  days: DayForecast[]
}

export default function DashboardWeatherPanel({ open, onToggle, filtroFinca }: Props) {
  const fincas = useMemo(() => {
    if (filtroFinca !== 'todas') return [filtroFinca]
    return listFincasConClima()
  }, [filtroFinca])

  const [forecasts, setForecasts] = useState<FincaForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    Promise.all(
      fincas.map(async fincaId => {
        const days = await fetchForecast(fincaId, 3, fincaId)
        return { fincaId, days }
      }),
    )
      .then(results => {
        if (!cancelled) {
          setForecasts(results.filter(r => r.days.length > 0))
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setForecasts([])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [fincas])

  return (
    <DashboardPanel
      title="Pronóstico"
      icon={<CloudSun size={16} />}
      open={open}
      onToggle={onToggle}
    >
      {loading && <p className="dashboard-weather-status">Cargando pronóstico…</p>}
      {!loading && error && (
        <p className="dashboard-weather-status dashboard-weather-status--error">
          No se pudo cargar el pronóstico.
        </p>
      )}
      {!loading && !error && forecasts.length === 0 && (
        <p className="dashboard-weather-status">Sin datos de clima para la finca seleccionada.</p>
      )}
      {!loading && forecasts.length > 0 && (
        <div className="dashboard-weather-list">
          {forecasts.map(({ fincaId, days }) => (
            <div key={fincaId} className="dashboard-weather-finca">
              {filtroFinca === 'todas' && (
                <div className="dashboard-weather-finca-title">{fincaId}</div>
              )}
              <div className="dashboard-weather-days">
                {days.map(day => (
                  <div key={`${fincaId}-${day.date}`} className="dashboard-weather-day">
                    <span className="dashboard-weather-day-label">
                      {formatForecastDayLabel(day.date)}
                    </span>
                    <span className="dashboard-weather-day-icon" aria-hidden>
                      {getWeatherEmoji(day.weatherCode)}
                    </span>
                    <span className="dashboard-weather-day-temp">
                      {day.temperatureMin}° / {day.temperatureMax}°
                    </span>
                    <span className="dashboard-weather-day-desc">
                      {weatherCodeToLabel(day.weatherCode)}
                    </span>
                    {day.precipitation > 0 && (
                      <span className="dashboard-weather-day-rain">{day.precipitation} mm</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
