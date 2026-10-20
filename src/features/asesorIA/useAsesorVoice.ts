import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribirAudio } from './asesorIaService'
import { AsesorIaError } from './types'

interface SpeechAlternative {
  transcript: string
}

interface SpeechResult {
  readonly isFinal: boolean
  readonly 0?: SpeechAlternative
}

interface SpeechResultList {
  readonly length: number
  [index: number]: SpeechResult
}

interface SpeechResultEvent {
  readonly results: SpeechResultList
}

interface SpeechErrorEvent {
  readonly error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => SpeechRecognitionLike
type InputMode = 'speech' | 'record' | 'none'

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const vendor = window as Window & {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  if (typeof vendor.webkitSpeechRecognition === 'function') return vendor.webkitSpeechRecognition
  if (typeof vendor.SpeechRecognition === 'function') return vendor.SpeechRecognition
  return null
}

/** Chrome y Edge traen el servicio de dictado. Electron, Cursor y Firefox no. */
function browserSpeechService(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/Electron|Cursor\//i.test(ua)) return false
  if (/Firefox|FxiOS/i.test(ua)) return false
  if (/Edg\//.test(ua)) return true
  return /Chrome\//.test(ua) && !/OPR\//.test(ua)
}

function canRecord(): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
    && typeof MediaRecorder !== 'undefined'
}

export function speechRecognitionAvailable(): boolean {
  return recognitionCtor() != null && browserSpeechService()
}

export function speechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

/** Quita `*` de markdown para que la voz no diga "asterisco". El texto en pantalla no cambia. */
export function textForSpeech(text: string): string {
  return text.replace(/\*+/g, '')
}

function recorderMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
  return ''
}

function permissionMessage(error: unknown): string | null {
  const name = error instanceof DOMException || error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'No tengo permiso para usar el micrófono. Habilitalo en el navegador o escribí la consulta.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No encuentro un micrófono en este dispositivo. Podés escribir la consulta.'
  }
  return null
}

interface VoiceOptions {
  onTranscript: (text: string, isFinal: boolean) => void
}

export function useAsesorVoice({ onTranscript }: VoiceOptions) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('none')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const sessionRef = useRef(0)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const releaseCapture = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      try { recognition.abort() } catch { /* ya estaba detenido */ }
    }
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      try { recorder.stop() } catch { /* ya estaba detenido */ }
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const stopListening = useCallback(() => {
    sessionRef.current += 1
    releaseCapture()
    setListening(false)
  }, [releaseCapture])

  const beginRecording = useCallback(async () => {
    const session = ++sessionRef.current
    releaseCapture()
    if (!canRecord()) {
      setVoiceError('Este navegador no puede grabar audio. Abrí el escritorio en Chrome o Edge, o escribí la consulta.')
      setListening(false)
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      if (session !== sessionRef.current) return
      setVoiceError(permissionMessage(error) ?? 'No pude iniciar el micrófono. Probá de nuevo o escribí la consulta.')
      setListening(false)
      return
    }
    if (session !== sessionRef.current) {
      stream.getTracks().forEach(track => track.stop())
      return
    }
    const mime = recorderMime()
    let recorder: MediaRecorder
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch {
      stream.getTracks().forEach(track => track.stop())
      setVoiceError('Este navegador no puede grabar audio. Escribí la consulta.')
      setListening(false)
      return
    }
    chunksRef.current = []
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    streamRef.current = stream
    recorderRef.current = recorder
    try {
      recorder.start()
    } catch {
      releaseCapture()
      setVoiceError('No pude iniciar el micrófono. Probá de nuevo o escribí la consulta.')
      setListening(false)
      return
    }
    setInputMode('record')
    setVoiceError(null)
    setListening(true)
  }, [releaseCapture])

  const startSpeech = useCallback(async (lang: string) => {
    const session = ++sessionRef.current
    releaseCapture()
    const Ctor = recognitionCtor()
    if (!Ctor) {
      await beginRecording()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      if (session !== sessionRef.current) return
      setVoiceError(permissionMessage(error) ?? 'No pude iniciar el micrófono. Probá de nuevo o escribí la consulta.')
      setListening(false)
      return
    }
    if (session !== sessionRef.current) return

    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = event => {
      let text = ''
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index]?.[0]?.transcript ?? ''
      }
      const last = event.results[event.results.length - 1]
      onTranscriptRef.current(text.trim(), last?.isFinal ?? false)
    }
    recognition.onerror = event => {
      if (recognitionRef.current !== recognition) return
      const code = event.error
      if (code === 'language-not-supported' && lang !== 'es-ES') {
        recognitionRef.current = null
        void startSpeech('es-ES')
        return
      }
      if ((code === 'network' || code === 'service-not-allowed') && canRecord()) {
        recognitionRef.current = null
        void beginRecording()
        return
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setVoiceError('No tengo permiso para usar el micrófono. Habilitalo en el navegador o escribí la consulta.')
      } else if (code === 'audio-capture') {
        setVoiceError('No encuentro un micrófono en este dispositivo. Podés escribir la consulta.')
      } else if (code === 'no-speech') {
        setVoiceError('No escuché nada. Hablá de nuevo o escribí la consulta.')
      } else if (code === 'network') {
        setVoiceError('El dictado de este navegador no está disponible. Abrí el escritorio en Chrome o Edge, o escribí la consulta.')
      } else if (code !== 'aborted') {
        setVoiceError('No pude escuchar. Probá de nuevo o escribí la consulta.')
      }
      setListening(false)
    }
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return
      recognitionRef.current = null
      setListening(false)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setInputMode('speech')
      setListening(true)
    } catch {
      recognitionRef.current = null
      if (canRecord()) {
        void beginRecording()
        return
      }
      setVoiceError('No pude iniciar el micrófono. Probá de nuevo o escribí la consulta.')
      setListening(false)
    }
  }, [beginRecording, releaseCapture])

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      stopListening()
      return
    }
    sessionRef.current += 1
    setListening(false)
    setTranscribing(true)
    const blob = await new Promise<Blob>(resolve => {
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        resolve(new Blob(chunksRef.current, { type }))
      }
      try {
        recorder.stop()
      } catch {
        resolve(new Blob())
      }
    })
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    recorderRef.current = null
    try {
      const text = await transcribirAudio(blob)
      onTranscriptRef.current(text, true)
    } catch (error) {
      const text = error instanceof AsesorIaError
        ? error.message
        : 'No pude transcribir el audio. Probá de nuevo o escribí la consulta.'
      setVoiceError(text)
    } finally {
      setTranscribing(false)
    }
  }, [stopListening])

  const startListening = useCallback(() => {
    setVoiceError(null)
    if (speechRecognitionAvailable()) {
      void startSpeech('es-AR')
      return
    }
    if (canRecord()) {
      void beginRecording()
      return
    }
    setInputMode('none')
    setVoiceError('Este navegador no tiene reconocimiento de voz. Abrí el escritorio en Chrome o Edge, o escribí la consulta.')
  }, [beginRecording, startSpeech])

  const toggleListening = useCallback(() => {
    if (transcribing) return
    if (listening) {
      if (recorderRef.current) void finishRecording()
      else stopListening()
    } else {
      startListening()
    }
  }, [finishRecording, listening, startListening, stopListening, transcribing])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback((text: string) => {
    setVoiceError(null)
    if (!speechSynthesisAvailable()) {
      setVoiceError('Este navegador no puede leer en voz alta.')
      return
    }
    window.speechSynthesis.cancel()
    const spoken = textForSpeech(text).trim()
    if (!spoken) {
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = 'es-AR'
    utterance.rate = 1
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  useEffect(() => () => {
    sessionRef.current += 1
    recognitionRef.current?.abort()
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      try { recorder.stop() } catch { /* cierre del panel */ }
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
    window.speechSynthesis?.cancel()
  }, [])

  return {
    listening,
    speaking,
    transcribing,
    voiceError,
    canDictate: speechRecognitionAvailable() || canRecord(),
    inputMode,
    toggleListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
