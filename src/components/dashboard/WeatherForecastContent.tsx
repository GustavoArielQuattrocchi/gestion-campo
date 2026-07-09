import {
  formatForecastDayLabel,
  getWeatherEmoji,
  weatherCodeToLabel,
} from '../../utils/weatherService'
import type { FincaForecast } from '../../hooks/useFincaForecasts'

interface Props {
  forecasts: FincaForecast[]
  loading: boolean
  error: boolean
  showFincaTitle: boolean
}

export default function WeatherForecastContent({
  forecasts,
  loading,
  error,
  showFincaTitle,
}: Props) {
  if (loading) {
    return <p className="weather-float-status">Cargando pronóstico…</p>
  }

  if (error) {
    return <p className="weather-float-status weather-float-status--error">No se pudo cargar el pronóstico.</p>
  }

  if (forecasts.length === 0) {
    return <p className="weather-float-status">Sin datos de clima para la finca seleccionada.</p>
  }

  return (
    <div className="weather-float-list">
      {forecasts.map(({ fincaId, days }) => (
        <div key={fincaId} className="weather-float-finca">
          {showFincaTitle && <div className="weather-float-finca-title">{fincaId}</div>}
          <div className="weather-float-days">
            {days.map(day => (
              <article key={`${fincaId}-${day.date}`} className="weather-float-day">
                <header className="weather-float-day-head">
                  <span className="weather-float-day-label">{formatForecastDayLabel(day.date)}</span>
                  <span className="weather-float-day-icon" aria-hidden>
                    {getWeatherEmoji(day.weatherCode)}
                  </span>
                </header>
                <div className="weather-float-day-temp">
                  <span>{day.temperatureMax}°</span>
                  <small>{day.temperatureMin}°</small>
                </div>
                <p className="weather-float-day-desc">{weatherCodeToLabel(day.weatherCode)}</p>
                {day.precipitation > 0 && (
                  <span className="weather-float-day-rain">{day.precipitation} mm</span>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
