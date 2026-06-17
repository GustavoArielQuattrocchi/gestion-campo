import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'

export function formatTimestamp(
  ts: Timestamp | undefined,
  pattern = 'dd MMM yyyy, HH:mm',
): string {
  if (!ts?.toDate) return '—'
  try {
    return format(ts.toDate(), pattern, { locale: es })
  } catch {
    return '—'
  }
}
