import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Mic, Send, Sparkles, Square, Volume2, X } from 'lucide-react'
import { consultarAsesor } from './asesorIaService'
import { AsesorIaError, type AsesorTurn } from './types'
import { useAsesorVoice } from './useAsesorVoice'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const CERES_GREETING = 'Hola, soy Ceres, ¿en qué te puedo ayudar?'

function nextId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function AsesorIaPanel() {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [processing, setProcessing] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)
  const chatEpoch = useRef(0)
  const messagesRef = useRef<ChatMessage[]>([])
  const wasOpenRef = useRef(false)

  const onTranscript = useCallback((text: string) => {
    setDraft(text)
  }, [])

  const voice = useAsesorVoice({ onTranscript })
  messagesRef.current = messages

  useLayoutEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened || messagesRef.current.length > 0) return
    const greeting: ChatMessage = { id: nextId(), role: 'assistant', content: CERES_GREETING }
    messagesRef.current = [greeting]
    setMessages([greeting])
    voice.speak(CERES_GREETING)
  }, [open, voice.speak])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, processing, open])

  const close = useCallback(() => {
    chatEpoch.current += 1
    voice.stopListening()
    voice.stopSpeaking()
    messagesRef.current = []
    setMessages([])
    setDraft('')
    setProcessing(false)
    sendingRef.current = false
    setOpen(false)
  }, [voice.stopListening, voice.stopSpeaking])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const lastAssistant = [...messages].reverse().find(message => message.role === 'assistant')

  const send = async () => {
    const message = draft.trim()
    if (!message || processing || sendingRef.current) return
    sendingRef.current = true
    voice.stopListening()
    voice.stopSpeaking()
    const epoch = chatEpoch.current
    const prior: AsesorTurn[] = messages.slice(-6).map(item => ({ role: item.role, content: item.content }))
    setMessages(current => [...current, { id: nextId(), role: 'user', content: message }])
    setDraft('')
    setProcessing(true)
    try {
      const result = await consultarAsesor(message, prior)
      if (epoch !== chatEpoch.current) return
      setMessages(current => [...current, { id: nextId(), role: 'assistant', content: result.answer }])
      voice.speak(result.answer)
    } catch (error) {
      if (epoch !== chatEpoch.current) return
      const text = error instanceof AsesorIaError
        ? error.message
        : 'El asesor no pudo responder. Probá de nuevo en unos minutos.'
      setMessages(current => [...current, { id: nextId(), role: 'assistant', content: text }])
    } finally {
      if (epoch !== chatEpoch.current) return
      sendingRef.current = false
      setProcessing(false)
    }
  }

  const panel = open
    ? createPortal(
      <aside className="asesor-ia-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
        <header className="asesor-ia-header">
          <div>
            <h2 id={titleId}>Asesor IA</h2>
            <p>Consultas sobre partes de labores</p>
          </div>
          <div className="asesor-ia-header-actions">
            <button
              type="button"
              className="btn-icon"
              title={voice.speaking ? 'Detener lectura' : 'Leer la última respuesta'}
              disabled={!lastAssistant || processing}
              onClick={() => {
                if (!lastAssistant) return
                if (voice.speaking) voice.stopSpeaking()
                else voice.speak(lastAssistant.content)
              }}
            >
              {voice.speaking ? <Square size={14} /> : <Volume2 size={14} />}
            </button>
            <button type="button" className="btn-icon" title="Cerrar" onClick={close}>
              <X size={14} />
            </button>
          </div>
        </header>

        <div className="asesor-ia-log" ref={listRef}>
          {messages.length === 0 && !processing ? (
            <p className="asesor-ia-empty">
              Preguntame qué se está haciendo hoy, qué terminamos ayer o qué hay pendiente en una finca.
            </p>
          ) : null}
          {messages.map(message => (
            <div key={message.id} className={`asesor-ia-bubble asesor-ia-bubble--${message.role}`}>
              {message.content}
            </div>
          ))}
          {processing ? (
            <div className="asesor-ia-bubble asesor-ia-bubble--assistant asesor-ia-bubble--pending">
              <Loader2 size={14} className="spin-icon" />
              Consultando…
            </div>
          ) : null}
        </div>

        <form
          className="asesor-ia-composer"
          onSubmit={event => {
            event.preventDefault()
            void send()
          }}
        >
          <textarea
            ref={inputRef}
            value={draft}
            rows={2}
            placeholder="Escribí o dictá una consulta"
            disabled={processing}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
          />
          <div className="asesor-ia-composer-actions">
            <button
              type="button"
              className={`btn btn-secondary asesor-ia-mic${voice.listening ? ' is-listening' : ''}`}
              onClick={voice.toggleListening}
              disabled={processing || voice.transcribing || !voice.canDictate}
              aria-pressed={voice.listening}
              title={
                !voice.canDictate
                  ? 'Este navegador no puede usar el micrófono'
                  : voice.listening
                    ? 'Detener micrófono'
                    : 'Hablar'
              }
            >
              <Mic size={14} />
              {voice.transcribing ? 'Transcribiendo' : voice.listening ? 'Escuchando' : 'Micrófono'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={processing || !draft.trim()}>
              <Send size={14} />
              Enviar
            </button>
          </div>
          {voice.listening ? (
            <p className="asesor-ia-status asesor-ia-status--live">
              <span className="asesor-ia-listening-dot" aria-hidden="true" />
              {voice.inputMode === 'record'
                ? 'Grabando… tocá Micrófono de nuevo al terminar.'
                : 'Escuchando…'}
            </p>
          ) : null}
          {voice.transcribing ? <p className="asesor-ia-status">Transcribiendo el audio…</p> : null}
          {!voice.canDictate ? (
            <p className="asesor-ia-status asesor-ia-status--error">
              Este navegador no puede dictar. Abrilo en Chrome o Edge, o escribí la consulta.
            </p>
          ) : null}
          {voice.voiceError ? <p className="asesor-ia-status asesor-ia-status--error">{voice.voiceError}</p> : null}
        </form>
      </aside>,
      document.body,
    )
    : null

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary asesor-ia-open"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Sparkles size={14} />
        Asesor IA
      </button>
      {panel}
    </>
  )
}
