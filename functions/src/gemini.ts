import { logger } from 'firebase-functions'
import { redact } from './text'

/**
 * Claves nuevas de AI Studio (prefijo AQ.) se autentican con el header
 * x-goog-api-key contra generativelanguage.googleapis.com. No usar
 * Authorization: Bearer: la API lo trata como OAuth y responde 401.
 *
 * gemini-2.5-flash y gemini-2.0-flash responden 404 a proyectos nuevos.
 * gemini-3.8-flash es el nombre que pide ese 404, pero puede responder 503
 * por demanda. gemini-3.5-flash-lite es el modelo estable para consultas cortas.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

const ALTERNATE_MODELS = [DEFAULT_GEMINI_MODEL, 'gemini-3.8-flash']

export interface GeminiTurn {
  role: 'user' | 'model'
  text: string
}

interface GeminiPart {
  text?: unknown
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] }
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return ''
  const first = candidates[0] as GeminiCandidate
  const parts = first.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts
    .map(part => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

function retryableModelError(error: unknown): boolean {
  return error instanceof Error && /Gemini HTTP (404|429|503)/.test(error.message)
}

async function generateResilient(options: {
  apiKey: string
  model: string
  system: string
  turns: GeminiTurn[]
  json: boolean
  maxOutputTokens: number
  audio?: { mimeType: string; data: string }
  allowEmpty?: boolean
}): Promise<string> {
  const chain = [options.model, ...ALTERNATE_MODELS.filter(model => model !== options.model)]
  let lastError: unknown = null
  for (let index = 0; index < chain.length; index += 1) {
    const model = chain[index] ?? options.model
    try {
      return await geminiGenerateOnce({ ...options, model })
    } catch (error) {
      lastError = error
      if (options.allowEmpty && error instanceof Error && error.message === 'Gemini devolvió una respuesta vacía') {
        return ''
      }
      const next = chain[index + 1]
      if (!next || !retryableModelError(error)) throw error
      logger.warn('asesorIa modelo no disponible, reintento', { pedido: model, usado: next })
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Gemini no respondió')
}

async function geminiGenerateOnce(options: {
  apiKey: string
  model: string
  system: string
  turns: GeminiTurn[]
  json: boolean
  maxOutputTokens: number
  audio?: { mimeType: string; data: string }
}): Promise<string> {
  const model = encodeURIComponent(options.model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const userParts: Array<Record<string, unknown>> = options.turns
    .filter(turn => turn.role === 'user')
    .map(turn => ({ text: turn.text }))
  if (options.audio) {
    userParts.push({
      inlineData: {
        mimeType: options.audio.mimeType,
        data: options.audio.data,
      },
    })
  }
  const contents = options.audio
    ? [{ role: 'user', parts: userParts }]
    : options.turns.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }))
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': options.apiKey,
    },
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents,
      generationConfig: {
        temperature: options.json ? 0 : 0.2,
        maxOutputTokens: options.maxOutputTokens,
        ...(options.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!response.ok) {
    const detail = redact(await response.text().catch(() => ''), options.apiKey).slice(0, 240)
    throw new Error(`Gemini HTTP ${response.status}${detail ? `: ${detail}` : ''}`)
  }

  const payload: unknown = await response.json()
  const text = extractText(payload)
  if (!text) throw new Error('Gemini devolvió una respuesta vacía')
  return text
}

export async function geminiGenerate(options: {
  apiKey: string
  model: string
  system: string
  turns: GeminiTurn[]
  json: boolean
  maxOutputTokens: number
}): Promise<string> {
  return generateResilient(options)
}

const TRANSCRIBE_SYSTEM = 'Transcribí audio de un viñedo en Mendoza. Devolvé solo el texto dictado, en español, sin comillas ni comentarios. Si no hay habla clara, devolvé vacío.'

export async function geminiTranscribe(options: {
  apiKey: string
  model: string
  mimeType: string
  data: string
}): Promise<string> {
  return generateResilient({
    apiKey: options.apiKey,
    model: options.model,
    system: TRANSCRIBE_SYSTEM,
    turns: [{ role: 'user', text: 'Transcribí este audio.' }],
    json: false,
    maxOutputTokens: 400,
    audio: { mimeType: options.mimeType, data: options.data },
    allowEmpty: true,
  })
}
