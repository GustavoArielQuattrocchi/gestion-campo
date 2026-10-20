import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { verifyAdmin } from './auth'
import { resolveFechaToken } from './dates'
import { canonicalFinca } from './fincas'
import { formatPartes, WRITER_SYSTEM, writerUserPrompt } from './formatAnswer'
import { DEFAULT_GEMINI_MODEL, geminiGenerate, geminiTranscribe, type GeminiTurn } from './gemini'
import { interpretSystemPrompt, interpretUserPrompt, parseInterpretJson, type InterpretOutcome } from './interpret'
import { queryPartes } from './queryPartes'
import { redact, truncate } from './text'
import {
  EMPTY_ANSWER,
  EMPTY_FILTERS,
  type AsesorRow,
  type ConversationTurn,
  type RawFilters,
  type ResolvedFilters,
} from './types'

if (getApps().length === 0) {
  initializeApp()
}

/** Secreto de Cloud Functions. Nunca lo expongas como VITE_ ni lo loguees. */
const geminiApiKey = defineSecret('GEMINI_API_KEY')

/**
 * Default: gemini-3.5-flash-lite. gemini-2.5-flash responde 404 en proyectos nuevos
 * y gemini-3.8-flash puede responder 503 por demanda. El cliente prueba el otro.
 * Para cambiarlo: GEMINI_MODEL en functions/.env antes del deploy.
 */
const geminiModel = defineString('GEMINI_MODEL', { default: DEFAULT_GEMINI_MODEL })

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
  'https://gestion-campo-ffe2d.web.app',
  'https://gestion-campo-ffe2d.firebaseapp.com',
]

const UNSUPPORTED_ANSWER = 'En esta versión solo puedo consultar tareas y partes de labores. Preguntame qué se está haciendo o qué se terminó.'

const REGION = 'southamerica-east1'

function readApiKey(): string {
  const fromEnv = process.env.GEMINI_API_KEY?.trim() ?? ''
  try {
    const fromSecret = geminiApiKey.value()?.trim() ?? ''
    return fromSecret || fromEnv
  } catch {
    return fromEnv
  }
}

function readModel(): string {
  const fallback = DEFAULT_GEMINI_MODEL
  let raw = ''
  try {
    raw = geminiModel.value()?.trim() ?? ''
  } catch {
    raw = ''
  }
  if (!raw) raw = process.env.GEMINI_MODEL?.trim() ?? ''
  if (!raw) return fallback
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(raw)) return fallback
  return raw
}

const MAX_AUDIO_CHARS = 1_800_000

function parseAudioBody(body: unknown): { mimeType: string; data: string } | null | 'invalid' {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (record.audio == null && record.mimeType == null) return null
  if (typeof record.audio !== 'string' || typeof record.mimeType !== 'string') return 'invalid'
  const mimeType = record.mimeType.trim().toLowerCase().split(';')[0]?.trim() ?? ''
  if (!/^audio\/[a-z0-9.+-]{1,40}$/.test(mimeType)) return 'invalid'
  const data = record.audio.replace(/\s/g, '')
  if (!data || data.length > MAX_AUDIO_CHARS || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return 'invalid'
  return { mimeType, data }
}

function clientErrorForGemini(error: unknown): { status: number; error: string } | null {
  if (!(error instanceof Error)) return null
  const match = /Gemini HTTP (\d+)/.exec(error.message)
  if (!match) return null
  const code = Number(match[1])
  if (code === 404) {
    return { status: 502, error: 'El modelo de IA configurado ya no está disponible.' }
  }
  if (code === 401 || code === 403) {
    return { status: 502, error: 'El servicio de IA rechazó la configuración del asesor.' }
  }
  if (code === 429 || code === 503) {
    return { status: 503, error: 'El servicio de IA está saturado. Probá de nuevo en un minuto.' }
  }
  return { status: 502, error: 'El servicio de IA no pudo responder. Probá de nuevo en unos minutos.' }
}

function parseBody(body: unknown): { message: string; conversation: ConversationTurn[] } | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (typeof record.message !== 'string') return null
  const message = record.message.trim()
  if (!message || message.length > 2000) return null

  const conversation: ConversationTurn[] = []
  if (record.conversation != null) {
    if (!Array.isArray(record.conversation)) return null
    for (const item of record.conversation) {
      if (!item || typeof item !== 'object') continue
      const turn = item as Record<string, unknown>
      if ((turn.role !== 'user' && turn.role !== 'assistant') || typeof turn.content !== 'string') continue
      const content = turn.content.trim()
      if (!content) continue
      conversation.push({ role: turn.role, content: content.slice(0, 4000) })
    }
  }

  return { message, conversation: conversation.slice(-6) }
}

function resolveFilters(raw: RawFilters, now = new Date()): ResolvedFilters {
  const finca = raw.finca ? (canonicalFinca(raw.finca) ?? raw.finca) : null
  return {
    fecha: resolveFechaToken(raw.fecha, now),
    finca,
    cuartel: raw.cuartel,
    estado: raw.estado,
    responsable: raw.responsable,
    tipo_tarea: raw.tipo_tarea,
  }
}

function historyTurns(conversation: ConversationTurn[]): GeminiTurn[] {
  return conversation.slice(-6).map(turn => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    text: truncate(turn.content, 800),
  }))
}

async function interpretWithRetry(
  apiKey: string,
  model: string,
  message: string,
  conversation: ConversationTurn[],
): Promise<InterpretOutcome> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const text = await geminiGenerate({
        apiKey,
        model,
        system: interpretSystemPrompt(),
        json: true,
        maxOutputTokens: 300,
        turns: [
          ...historyTurns(conversation),
          { role: 'user', text: interpretUserPrompt(message) },
        ],
      })
      const outcome = parseInterpretJson(text)
      if (outcome.kind !== 'invalid') return outcome
      logger.warn('asesorIa interpretacion invalida', { intento: attempt + 1 })
    } catch (error) {
      lastError = error
      const detail = error instanceof Error ? redact(error.message, apiKey).slice(0, 240) : 'error'
      logger.warn('asesorIa interpretacion fallo', { intento: attempt + 1, detalle: detail })
    }
  }
  if (lastError && lastError instanceof Error && /Gemini HTTP/.test(lastError.message)) {
    throw lastError
  }
  return { kind: 'invalid' }
}

async function draftAnswer(
  apiKey: string,
  model: string,
  question: string,
  rows: AsesorRow[],
  truncated: boolean,
): Promise<string> {
  if (rows.length === 0) return EMPTY_ANSWER
  try {
    const text = (await geminiGenerate({
      apiKey,
      model,
      system: WRITER_SYSTEM,
      json: false,
      maxOutputTokens: 700,
      turns: [{ role: 'user', text: writerUserPrompt(question, rows, truncated) }],
    })).trim()
    if (!text || text === EMPTY_ANSWER) return formatPartes(rows, truncated)
    return text
  } catch (error) {
    const detail = error instanceof Error ? redact(error.message, apiKey).slice(0, 240) : 'error'
    logger.warn('asesorIa redaccion fallback', { detalle: detail })
    return formatPartes(rows, truncated)
  }
}

export const asesorIa = onRequest(
  {
    region: REGION,
    cors: ALLOWED_ORIGINS,
    secrets: [geminiApiKey],
    invoker: 'public',
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método no permitido.' })
      return
    }

    try {
      const admin = await verifyAdmin(req.header('authorization') ?? req.header('Authorization'))
      if (!admin.ok) {
        res.status(admin.status).json({ error: admin.error })
        return
      }

      const audio = parseAudioBody(req.body)
      if (audio === 'invalid') {
        res.status(400).json({ error: 'El audio es inválido. Probá de nuevo o escribí la consulta.' })
        return
      }

      const apiKey = readApiKey()
      if (!apiKey) {
        logger.error('asesorIa: falta GEMINI_API_KEY')
        res.status(503).json({ error: 'El asesor no está configurado en el servidor.' })
        return
      }
      const model = readModel()
      if (audio) {
        logger.info('asesorIa transcripcion', { modelo: model, mime: audio.mimeType })
        const transcript = (await geminiTranscribe({
          apiKey,
          model,
          mimeType: audio.mimeType,
          data: audio.data,
        })).trim()
        if (!transcript) {
          res.status(422).json({ error: 'No pude entender el audio. Probá de nuevo o escribí la consulta.' })
          return
        }
        res.json({ transcript })
        return
      }

      const body = parseBody(req.body)
      if (!body) {
        res.status(400).json({ error: 'El mensaje es inválido.' })
        return
      }

      logger.info('asesorIa consulta', {
        pregunta: truncate(body.message, 180),
        modelo: model,
      })

      const interpreted = await interpretWithRetry(apiKey, model, body.message, body.conversation)
      if (interpreted.kind === 'invalid') {
        res.status(422).json({ error: 'No pude interpretar la consulta. Probá reformularla.' })
        return
      }
      if (interpreted.kind === 'no_soportado') {
        logger.info('asesorIa resultado', { intent: 'no_soportado', encontrados: 0 })
        res.json({
          answer: UNSUPPORTED_ANSWER,
          intent: 'no_soportado',
          filters: EMPTY_FILTERS,
          data: [],
        })
        return
      }

      const filters = resolveFilters(interpreted.filters)
      const { rows, truncated } = await queryPartes(getFirestore(), filters)
      logger.info('asesorIa resultado', {
        intent: 'consultar_tareas',
        filters,
        encontrados: rows.length,
        truncado: truncated,
      })

      const answer = await draftAnswer(apiKey, model, body.message, rows, truncated)
      res.json({
        answer,
        intent: 'consultar_tareas',
        filters,
        data: rows,
      })
    } catch (error) {
      const apiKey = process.env.GEMINI_API_KEY ?? ''
      const detail = error instanceof Error ? redact(error.message, apiKey).slice(0, 300) : 'error'
      logger.error('asesorIa error', { detalle: detail })
      const geminiError = clientErrorForGemini(error)
      if (geminiError) {
        res.status(geminiError.status).json({ error: geminiError.error })
        return
      }
      res.status(500).json({ error: 'El asesor no pudo responder. Probá de nuevo en unos minutos.' })
    }
  },
)
