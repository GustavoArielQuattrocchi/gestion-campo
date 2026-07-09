import type { WeatherSnapshot } from '../../types'
import {
  formatWeatherSummary,
  getWeatherEmoji,
  weatherCodeToLabel,
} from '../../utils/weatherService'

interface Props {
  weather: WeatherSnapshot
  compact?: boolean
  label?: string
}

export default function WeatherDisplay({ weather, compact = false, label }: Props) {
  return (
    <div className={`weather-display ${compact ? 'weather-display--compact' : ''}`}>
      <span className="weather-display-icon" aria-hidden>
        {getWeatherEmoji(weather.weatherCode)}
      </span>
      <div className="weather-display-body">
        {label && <span className="weather-display-label">{label}</span>}
        <strong>{weatherCodeToLabel(weather.weatherCode)}</strong>
        <span>{formatWeatherSummary(weather)}</span>
      </div>
    </div>
  )
}
