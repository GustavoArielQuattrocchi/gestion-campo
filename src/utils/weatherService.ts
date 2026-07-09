const FINCA_COORDS: Record<string, { lat: number; lon: number }> = {
  'FOA': { lat: -33.35, lon: -69.25 },
  'FLP': { lat: -33.45, lon: -69.20 },
  'FSP': { lat: -33.30, lon: -69.35 },
  'FET': { lat: -33.40, lon: -69.30 },
  'FC2': { lat: -33.38, lon: -69.28 },
  'FC3': { lat: -33.39, lon: -69.29 },
}

export interface WeatherData {
  temperatureMax: number
  temperatureMin: number
  precipitation: number
  windSpeedMax: number
  weatherCode: number
}

export async function fetchTodayWeather(fincaId: string): Promise<WeatherData | null> {
  const coords = FINCA_COORDS[fincaId]
  if (!coords) return null

  try {
    const today = new Date().toISOString().split('T')[0]
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=America/Argentina/Mendoza&start_date=${today}&end_date=${today}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return {
      temperatureMax: data.daily.temperature_2m_max[0],
      temperatureMin: data.daily.temperature_2m_min[0],
      precipitation: data.daily.precipitation_sum[0],
      windSpeedMax: data.daily.wind_speed_10m_max[0],
      weatherCode: data.daily.weather_code[0],
    }
  } catch {
    return null
  }
}

export function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Despejado'
  if (code <= 3) return 'Parcialmente nublado'
  if (code <= 48) return 'Niebla'
  if (code <= 57) return 'Llovizna'
  if (code <= 67) return 'Lluvia'
  if (code <= 77) return 'Nieve'
  if (code <= 82) return 'Chaparrones'
  if (code <= 86) return 'Nieve intensa'
  if (code <= 99) return 'Tormenta'
  return 'Desconocido'
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}
