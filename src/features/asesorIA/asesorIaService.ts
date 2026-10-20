import { auth } from '../../firebase'
import {
  AsesorIaError,
  type AsesorFilters,
  type AsesorResponse,
  type AsesorRow,
  type AsesorTurn,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function optionalString(value: unknown): string | null {
  if (value == null) return null
  return typeof value === 'string' ? value : null
}

function parseEstado(value: unknown): AsesorFilters['estado'] | undefined {
  if (value == null) return null
  if (value === 'abierto' || value === 'cerrado') return value
  return undefined
}

function parseTipo(value: unknown): AsesorFilters['tipo_tarea'] | undefined {
  if (value == null) return null
  if (value === 'manual' || value === 'mecanica') return value
  return undefined
}

function parseFilters(value: unknown): AsesorFilters | null {
  if (!isRecord(value)) return null
  const estado = parseEstado(value.estado)
  const tipo = parseTipo(value.tipo_tarea)
  if (estado === undefined || tipo === undefined) return null
  if (optionalString(value.fecha) === null && value.fecha != null) return null
  if (optionalString(value.finca) === null && value.finca != null) return null
  if (optionalString(value.cuartel) === null && value.cuartel != null) return null
  if (optionalString(value.responsable) === null && value.responsable != null) return null
  return {
    fecha: optionalString(value.fecha),
    finca: optionalString(value.finca),
    cuartel: optionalString(value.cuartel),
    estado,
    responsable: optionalString(value.responsable),
    tipo_tarea: tipo,
  }
}

function parseRow(value: unknown): AsesorRow | null {
  if (!isRecord(value)) return null
  if (
    typeof value.finca !== 'string'
    || typeof value.cuartel !== 'string'
    || typeof value.tarea !== 'string'
    || typeof value.estado !== 'string'
    || typeof value.responsable !== 'string'
    || typeof value.fecha !== 'string'
  ) {
    return null
  }
  return {
    finca: value.finca,
    cuartel: value.cuartel,
    tarea: value.tarea,
    estado: value.estado,
    responsable: value.responsable,
    fecha: value.fecha,
  }
}

function parseResponse(payload: unknown): AsesorResponse {
  if (!isRecord(payload) || typeof payload.answer !== 'string' || !payload.answer.trim()) {
    throw new AsesorIaError('El asesor respondió con un formato inválido.')
  }
  const filters = parseFilters(payload.filters)
  if (!filters || typeof payload.intent !== 'string') {
    throw new AsesorIaError('El asesor respondió con un formato inválido.')
  }
  const data: AsesorRow[] = []
  if (payload.data != null) {
    if (!Array.isArray(payload.data)) {
      throw new AsesorIaError('El asesor respondió con un formato inválido.')
    }
    for (const item of payload.data) {
      const row = parseRow(item)
      if (!row) throw new AsesorIaError('El asesor respondió con un formato inválido.')
      data.push(row)
    }
  }
  return {
    answer: payload.answer.trim(),
    intent: payload.intent,
    filters,
    data,
  }
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return 'No tenés permiso para usar el asesor. Iniciá sesión con un usuario administrador.'
  }
  if (status === 404) {
    return 'El asesor no está disponible. Revisá que la función esté desplegada y que VITE_ASESOR_API_URL sea correcta.'
  }
  if (status === 503) return 'El asesor no está configurado en el servidor.'
  if (status === 422) return 'No pude interpretar la consulta. Probá reformularla.'
  if (status === 429) return 'El asesor está recibiendo muchas consultas. Probá de nuevo en un minuto.'
  if (status === 502) return 'El servicio de IA no pudo responder. Probá de nuevo en unos minutos.'
  return 'El asesor no pudo responder. Probá de nuevo en unos minutos.'
}

function safeServerMessage(payload: unknown): string | null {
  if (!isRecord(payload) || typeof payload.error !== 'string') return null
  const message = payload.error.trim()
  if (!message || message.length > 240) return null
  if (/api[_ -]?key|bearer |GEMINI_/i.test(message)) return null
  return message
}

function failureMessage(status: number, payload: unknown): string {
  const server = safeServerMessage(payload)
  const base = server ?? messageForStatus(status)
  if (!import.meta.env.DEV) return base
  return `${base} (HTTP ${status})`
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new AsesorIaError('No pude leer el audio grabado.'))
    }
    reader.onerror = () => reject(new AsesorIaError('No pude leer el audio grabado.'))
    reader.readAsDataURL(blob)
  })
  const comma = dataUrl.indexOf(',')
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

async function postAsesor(body: unknown): Promise<unknown> {
  const url = import.meta.env.VITE_ASESOR_API_URL?.trim()
  if (!url) {
    throw new AsesorIaError('El asesor no está configurado. Falta la variable VITE_ASESOR_API_URL.')
  }

  const user = auth.currentUser
  if (!user) {
    throw new AsesorIaError('Tenés que iniciar sesión como administrador para consultar el asesor.')
  }

  const idToken = await user.getIdToken()
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    const hint = import.meta.env.DEV ? ' La función no respondió o el navegador bloqueó la solicitud.' : ''
    throw new AsesorIaError(`No pude conectar con el asesor. Revisá tu conexión o si la función está desplegada.${hint}`)
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new AsesorIaError(failureMessage(response.status, payload))
  return payload
}

/**
 * Consulta el asesor en el servidor. El componente no habla con Gemini:
 * la key vive solo en la Cloud Function.
 */
export async function consultarAsesor(message: string, conversation: AsesorTurn[]): Promise<AsesorResponse> {
  const history = conversation
    .filter(turn => (turn.role === 'user' || turn.role === 'assistant') && turn.content.trim())
    .slice(-6)
    .map(turn => ({ role: turn.role, content: turn.content.trim().slice(0, 4000) }))

  const payload = await postAsesor({ message: message.trim(), conversation: history })
  return parseResponse(payload)
}

/** Dictado cuando el navegador no puede usar el servicio de voz de Chrome o Edge. */
export async function transcribirAudio(blob: Blob): Promise<string> {
  if (blob.size < 800) {
    throw new AsesorIaError('No grabé audio. Hablá y tocá el micrófono de nuevo.')
  }
  const audio = await blobToBase64(blob)
  if (audio.length > 1_800_000) {
    throw new AsesorIaError('El audio es demasiado largo. Hacé una consulta más corta.')
  }
  const mimeType = (blob.type || 'audio/webm').split(';')[0]?.trim() || 'audio/webm'
  const payload = await postAsesor({ audio, mimeType })
  if (!isRecord(payload) || typeof payload.transcript !== 'string' || !payload.transcript.trim()) {
    throw new AsesorIaError('No pude entender el audio. Probá de nuevo o escribí la consulta.')
  }
  return payload.transcript.trim()
}
