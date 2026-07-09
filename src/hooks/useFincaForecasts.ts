import { useEffect, useMemo, useState } from 'react'
import { fetchForecast, listFincasConClima } from '../utils/weatherService'
import type { DayForecast } from '../utils/weatherService'

export interface FincaForecast {
  fincaId: string
  days: DayForecast[]
}

export function useFincaForecasts(filtroFinca: string) {
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

  return { forecasts, loading, error, showFincaTitle: filtroFinca === 'todas' }
}
