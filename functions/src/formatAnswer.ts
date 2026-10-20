import { EMPTY_ANSWER, type AsesorRow } from './types'

function formatHumanDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

function estadoLabel(estado: AsesorRow['estado']): string {
  return estado === 'abierto' ? 'en ejecución' : 'cerrado'
}

/** Respuesta de respaldo. Solo usa las filas recibidas. */
export function formatPartes(rows: AsesorRow[], truncated = false): string {
  if (rows.length === 0) return EMPTY_ANSWER

  const byFinca = new Map<string, AsesorRow[]>()
  for (const row of rows) {
    const list = byFinca.get(row.finca) ?? []
    list.push(row)
    byFinca.set(row.finca, list)
  }

  const lines: string[] = []
  for (const [finca, list] of byFinca) {
    lines.push(finca)
    for (const row of list) {
      lines.push(`• ${row.cuartel} — ${row.tarea} — ${estadoLabel(row.estado)} — ${row.responsable} — ${formatHumanDate(row.fecha)}`)
    }
    lines.push('')
  }
  if (truncated) lines.push('Hay más resultados; mostré los primeros 40.')
  return lines.join('\n').trim()
}

export const WRITER_SYSTEM = `Sos el asistente agrícola del equipo de campo.
Respondé en español, breve y claro.
Agrupá por finca y, dentro de cada finca, por cuartel.
Usá exclusivamente las filas del mensaje. No inventes labores, personas, fechas, fincas ni cuarteles.
No menciones herramientas, modelos, bases de datos ni cómo obtuviste los datos.
Si la lista está vacía, respondé exactamente: "${EMPTY_ANSWER}"`

export function writerUserPrompt(question: string, rows: AsesorRow[], truncated: boolean): string {
  return [
    `Pregunta: ${question}`,
    truncated ? 'Nota: la lista está recortada a 40 filas.' : '',
    'Filas:',
    JSON.stringify(rows),
  ].filter(Boolean).join('\n')
}
