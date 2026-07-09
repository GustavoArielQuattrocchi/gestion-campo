import { useEffect, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ParteDeLabores } from '../../types'
import { fetchWeatherForDate } from '../../utils/weatherService'
import WeatherDisplay from './WeatherDisplay'

interface Props {
  parte: ParteDeLabores
}

function parteFechaClima(parte: ParteDeLabores): Date {
  if (parte.estado === 'cerrado' && parte.cerradoEn) return parte.cerradoEn.toDate()
  return parte.abiertoEn.toDate()
}

function climaLabel(fecha: Date): string {
  if (isSameDay(fecha, new Date())) return 'Clima del día'
  return `Clima del ${format(fecha, "d 'de' MMMM", { locale: es })}`
}

export default function ParteWeather({ parte }: Props) {
  const [fetched, setFetched] = useState(parte.clima ?? null)
  const [loading, setLoading] = useState(!parte.clima)

  useEffect(() => {
    if (parte.clima) {
      setFetched(parte.clima)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const fecha = parteFechaClima(parte)
    fetchWeatherForDate(parte.fincaId, fecha, parte.fincaNombre).then(data => {
      if (!cancelled) {
        setFetched(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [parte])

  if (loading) {
    return <p className="parte-labores-clima parte-labores-clima--loading">Cargando clima…</p>
  }

  if (!fetched) return null

  const fecha = parteFechaClima(parte)
  return (
    <div className="parte-labores-clima">
      <WeatherDisplay weather={fetched} compact label={climaLabel(fecha)} />
    </div>
  )
}
