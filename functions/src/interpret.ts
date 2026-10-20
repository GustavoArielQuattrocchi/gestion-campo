import { isIsoDate } from './dates'
import type { RawFilters, TipoTareaFiltro, ParteEstadoFiltro } from './types'

export type InterpretOutcome =
  | { kind: 'consulta'; filters: RawFilters }
  | { kind: 'no_soportado' }
  | { kind: 'invalid' }

const INTERPRET_SYSTEM = `Sos un clasificador de consultas de un viñedo en Mendoza, Argentina.
Devolvé SOLO un objeto JSON, sin markdown, con esta forma exacta:
{"intent":"consultar_tareas","filters":{"fecha":null,"finca":null,"cuartel":null,"estado":null,"responsable":null,"tipo_tarea":null}}

Reglas de negocio:
- Esta versión solo consulta labores. Si piden crear, editar, borrar, asignar, cargar o cualquier acción que no sea consultar, respondé {"intent":"no_soportado","filters":null}.
- La fuente son partes de labores, no el estado general de la tarea. No uses en_progreso ni finalizada.
- "qué estamos haciendo", "en ejecución", "qué se está haciendo", "en curso", "hoy en el campo" = estado "abierto".
- "qué terminamos", "finalizadas", "cerradas", "qué se hizo", "qué cerramos" = estado "cerrado". Si no dicen otra fecha, fecha = "hoy".
- "pendientes" sin una fecha = estado "abierto" y fecha null (incluye partes que siguen abiertos de días anteriores). No uses fecha "hoy" en ese caso.
- Si no mencionan fecha y la pregunta es la actividad actual, "en ejecución" o dice "hoy", fecha = "hoy".
- Si dicen "ayer", fecha = "ayer". No calcules el día: el servidor lo resuelve.
- Una fecha concreta va como "YYYY-MM-DD". Si no hay fecha y no corresponde "hoy" ni "pendientes", fecha = null.
- Fincas válidas: FOA (Oasis), FLP (La Pampa), FSP (San Pablo), FET, FC2 (también SC2), FC3 (también SC3). Si no mencionan finca, null.
- cuartel: el número o el nombre si lo dicen ("18", "cuartel 18", "FOA-18"). Si no, null.
- tipo_tarea "manual" si dicen manual o cuadrilla; "mecanica" si dicen máquina, tractor o mecánica. Si no, null.
- responsable: nombre de persona, cuadrilla o empresa solo si lo mencionan.
- No inventes filtros que la pregunta no diga.`

export function interpretSystemPrompt(): string {
  return INTERPRET_SYSTEM
}

export function interpretUserPrompt(message: string): string {
  return `Clasificá esta consulta y devolvé solo el JSON.\nConsulta: ${message}`
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value == null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) return undefined
  return trimmed
}

function parseFecha(value: unknown): RawFilters['fecha'] | undefined {
  if (value == null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed === 'hoy' || trimmed === 'ayer') return trimmed
  if (isIsoDate(trimmed)) return trimmed
  return undefined
}

function parseEstado(value: unknown): ParteEstadoFiltro | null | undefined {
  if (value == null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed === 'abierto' || trimmed === 'cerrado') return trimmed
  return undefined
}

function parseTipo(value: unknown): TipoTareaFiltro | null | undefined {
  if (value == null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed === 'manual' || trimmed === 'mecanica') return trimmed
  return undefined
}

export function parseInterpretJson(text: string): InterpretOutcome {
  let parsed: unknown
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    parsed = JSON.parse(cleaned)
  } catch {
    return { kind: 'invalid' }
  }
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' }
  const record = parsed as Record<string, unknown>
  const intent = typeof record.intent === 'string' ? record.intent.trim() : ''
  if (intent === 'no_soportado') return { kind: 'no_soportado' }
  if (intent !== 'consultar_tareas') return { kind: 'invalid' }
  if (!record.filters || typeof record.filters !== 'object') return { kind: 'invalid' }
  const filters = record.filters as Record<string, unknown>
  const fecha = parseFecha(filters.fecha)
  const finca = optionalText(filters.finca, 40)
  const cuartel = optionalText(filters.cuartel, 60)
  const estado = parseEstado(filters.estado)
  const responsable = optionalText(filters.responsable, 80)
  const tipo = parseTipo(filters.tipo_tarea)
  if (
    fecha === undefined
    || finca === undefined
    || cuartel === undefined
    || estado === undefined
    || responsable === undefined
    || tipo === undefined
  ) {
    return { kind: 'invalid' }
  }
  return {
    kind: 'consulta',
    filters: {
      fecha,
      finca,
      cuartel,
      estado,
      responsable,
      tipo_tarea: tipo,
    },
  }
}
