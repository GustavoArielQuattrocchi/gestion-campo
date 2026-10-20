/**
 * Día de campo en Mendoza. America/Argentina/Buenos_Aires es UTC−3 todo el año,
 * igual que America/Argentina/Mendoza (el que usa el clima del escritorio).
 * "Hoy" y "ayer" se resuelven acá, no con el reloj UTC del servidor.
 */
export const FIELD_TIME_ZONE = 'America/Argentina/Buenos_Aires'

export function formatDayKey(date: Date, timeZone = FIELD_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function shiftDayKey(dayKey: string, deltaDays: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays, 15, 0, 0))
  return formatDayKey(utc)
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
}

/** `hoy` / `ayer` / `YYYY-MM-DD` → clave de día, o null si no hay filtro de fecha. */
export function resolveFechaToken(token: 'hoy' | 'ayer' | string | null, now = new Date()): string | null {
  if (token == null) return null
  if (token === 'hoy') return formatDayKey(now)
  if (token === 'ayer') return shiftDayKey(formatDayKey(now), -1)
  if (isIsoDate(token)) return token
  return null
}

export function lookbackStart(now = new Date(), days = 60): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}
