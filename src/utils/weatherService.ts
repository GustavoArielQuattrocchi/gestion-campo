import { addDays, format } from 'date-fns'
import type { WeatherSnapshot } from '../types'

const TIMEZONE = 'America/Argentina/Mendoza'

const FINCA_COORDS: Record<string, { lat: number; lon: number }> = {
  FOA: { lat: -33.35, lon: -69.25 },
  FLP: { lat: -33.45, lon: -69.2 },
  FSP: { lat: -33.3, lon: -69.35 },
  FET: { lat: -33.4, lon: -69.3 },
  FC2: { lat: -33.38, lon: -69.28 },
  FC3: { lat: -33.39, lon: -69.29 },
}

export type WeatherData = WeatherSnapshot

export interface DayForecast extends WeatherSnapshot {
  date: string
}

const weatherCache = new Map<string, WeatherData | null>()

function cacheKey(fincaId: string, date: string): string {
  return `${fincaId}:${date}`
}

export function localDateStr(date = new Date(), timeZone = TIMEZONE): string {
  return date.toLocaleDateString('en-CA', { timeZone })
}

export function resolveFincaCoords(fincaId: string, fincaNombre?: string): { lat: number; lon: number } | null {
  const id = fincaId.trim().toUpperCase()
  if (FINCA_COORDS[id]) return FINCA_COORDS[id]
  const nombre = fincaNombre?.trim().toUpperCase()
  if (nombre && FINCA_COORDS[nombre]) return FINCA_COORDS[nombre]
  return null
}

export function listFincasConClima(): string[] {
  return Object.keys(FINCA_COORDS)
}

function parseDailyWeather(data: {
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    wind_speed_10m_max: number[]
    weather_code: number[]
  }
}, index = 0): WeatherData | null {
  const { daily } = data
  if (!daily?.temperature_2m_max?.[index]) return null
  return {
    temperatureMax: daily.temperature_2m_max[index],
    temperatureMin: daily.temperature_2m_min[index],
    precipitation: daily.precipitation_sum[index] ?? 0,
    windSpeedMax: daily.wind_speed_10m_max[index] ?? 0,
    weatherCode: daily.weather_code[index] ?? 0,
  }
}

async function fetchForecastRange(
  coords: { lat: number; lon: number },
  startDate: string,
  endDate: string,
): Promise<WeatherData[]> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code',
    timezone: TIMEZONE,
    start_date: startDate,
    end_date: endDate,
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  const count = data.daily?.temperature_2m_max?.length ?? 0
  const results: WeatherData[] = []
  for (let i = 0; i < count; i++) {
    const parsed = parseDailyWeather(data, i)
    if (parsed) results.push(parsed)
  }
  return results
}

async function fetchArchiveDay(
  coords: { lat: number; lon: number },
  date: string,
): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code',
    timezone: TIMEZONE,
    start_date: date,
    end_date: date,
  })
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  return parseDailyWeather(data, 0)
}

export async function fetchTodayWeather(fincaId: string, fincaNombre?: string): Promise<WeatherData | null> {
  return fetchWeatherForDate(fincaId, new Date(), fincaNombre)
}

export async function fetchWeatherForDate(
  fincaId: string,
  date: Date,
  fincaNombre?: string,
): Promise<WeatherData | null> {
  const dateStr = localDateStr(date)
  const key = cacheKey(fincaId, dateStr)
  if (weatherCache.has(key)) return weatherCache.get(key) ?? null

  const coords = resolveFincaCoords(fincaId, fincaNombre)
  if (!coords) {
    weatherCache.set(key, null)
    return null
  }

  const today = localDateStr()
  let result: WeatherData | null = null

  try {
    if (dateStr >= today) {
      const rows = await fetchForecastRange(coords, dateStr, dateStr)
      result = rows[0] ?? null
    } else {
      result = await fetchArchiveDay(coords, dateStr)
    }
  } catch {
    result = null
  }

  weatherCache.set(key, result)
  return result
}

export async function fetchForecast(
  fincaId: string,
  days = 3,
  fincaNombre?: string,
): Promise<DayForecast[]> {
  const coords = resolveFincaCoords(fincaId, fincaNombre)
  if (!coords || days < 1) return []

  const startDate = localDateStr()
  const endDate = localDateStr(addDays(new Date(), days - 1))

  try {
    const rows = await fetchForecastRange(coords, startDate, endDate)
    return rows.map((row, index) => ({
      ...row,
      date: localDateStr(addDays(new Date(), index)),
    }))
  } catch {
    return []
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

export function formatWeatherSummary(weather: WeatherSnapshot): string {
  return `${weather.temperatureMin}° / ${weather.temperatureMax}° · ${weather.precipitation} mm lluvia · viento ${Math.round(weather.windSpeedMax)} km/h`
}

export function formatForecastDayLabel(dateStr: string): string {
  const today = localDateStr()
  const tomorrow = localDateStr(addDays(new Date(), 1))
  if (dateStr === today) return 'Hoy'
  if (dateStr === tomorrow) return 'Mañana'
  return format(new Date(`${dateStr}T12:00:00`), 'EEE d/M')
}
