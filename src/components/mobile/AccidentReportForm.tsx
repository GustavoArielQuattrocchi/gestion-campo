import { useState, useRef, useCallback, useMemo } from 'react'
import Webcam from 'react-webcam'
import { ChevronLeft, Camera, RotateCcw, AlertTriangle, X, Loader, Share2, Download, Image as ImageIcon } from 'lucide-react'
import { fincas, tareasManuales, tareasMecanicas } from '../../data/catalog'
import {
  ACCIDENTE_OTROS_ID,
  NATURALEZAS_LESION,
  PARTES_CUERPO,
  toggleChecklistId,
  type AccidenteChecklistItem,
} from '../../data/accidenteChecklist'
import { useMobileAppContext } from '../../contexts/MobileAppContext'
import { saveAccidentReport } from '../../utils/saveAccidentReport'
import { validateAccidentReport, type AccidentReportInput, type AccidenteTipoTarea } from '../../validation/accidentReport'
import {
  accidentReportFileName,
  buildAccidentReportPdf,
  downloadBlob,
} from '../../utils/buildAccidentReportPdf'

interface Props {
  operadorNombre: string
  fincaId: string
  fincaNombre: string
  onBack: () => void
  onSuccess: (detail?: string) => void
}

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

/** Safari en iOS solo permite getUserMedia en HTTPS o localhost, no en http://IP */
function puedeUsarCamaraEnVivo(): boolean {
  return Boolean(
    window.isSecureContext &&
    navigator.mediaDevices?.getUserMedia
  )
}

function leerImagenComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('No se pudo leer la imagen'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Error al leer la imagen'))
    reader.readAsDataURL(file)
  })
}

function puedeCompartirArchivo(file: File): boolean {
  if (!navigator.share) return false
  if (!navigator.canShare) return true
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function ChecklistGroup({
  title,
  items,
  selected,
  otroTexto,
  onToggle,
  onOtroChange,
}: {
  title: string
  items: AccidenteChecklistItem[]
  selected: string[]
  otroTexto: string
  onToggle: (id: string) => void
  onOtroChange: (value: string) => void
}) {
  const showOtro = selected.includes(ACCIDENTE_OTROS_ID)
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="accident-check-grid">
        {items.map(item => (
          <label
            key={item.id}
            className={`checkbox-item ${selected.includes(item.id) ? 'selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      {showOtro && (
        <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
          <input
            className="form-input"
            value={otroTexto}
            onChange={e => onOtroChange(e.target.value)}
            placeholder="Especificá Otros..."
          />
        </div>
      )}
    </div>
  )
}

export default function AccidentReportForm({
  operadorNombre,
  fincaId,
  fincaNombre,
  onBack,
  onSuccess,
}: Props) {
  const { showToast } = useMobileAppContext()
  const webcamRef = useRef<Webcam>(null)
  const inputCamaraRef = useRef<HTMLInputElement>(null)
  const inputGaleriaRef = useRef<HTMLInputElement>(null)

  const usarCamaraEnVivo = useMemo(() => puedeUsarCamaraEnVivo(), [])
  const contextoSeguro = useMemo(() => window.isSecureContext, [])

  const [foto, setFoto] = useState<string | null>(null)
  const [, setFotoArchivo] = useState<File | null>(null)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fincaSeleccionada, setFincaSeleccionada] = useState(fincaId)
  const [fincaNombreSel, setFincaNombreSel] = useState(fincaNombre)
  const [afectadoNombre, setAfectadoNombre] = useState(operadorNombre)
  const [afectadoDni, setAfectadoDni] = useState('')
  const [partesCuerpo, setPartesCuerpo] = useState<string[]>([])
  const [parteCuerpoOtro, setParteCuerpoOtro] = useState('')
  const [naturalezasLesion, setNaturalezasLesion] = useState<string[]>([])
  const [naturalezaLesionOtro, setNaturalezaLesionOtro] = useState('')
  const [tipo, setTipo] = useState<AccidenteTipoTarea | ''>('')
  const [tarea, setTarea] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const buildInput = (): AccidentReportInput => ({
    operador: operadorNombre,
    fincaId: fincaSeleccionada,
    fincaNombre: fincaNombreSel,
    descripcion,
    tieneFoto: Boolean(foto),
    afectadoNombre,
    afectadoDni,
    partesCuerpo,
    parteCuerpoOtro,
    naturalezasLesion,
    naturalezaLesionOtro,
    tipo,
    tarea,
  })

  const capturarFoto = useCallback(() => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      setFoto(imageSrc)
      setFotoArchivo(null)
      setMostrarCamara(false)
      setErrorCamara('')
    }
  }, [])

  const abrirCamara = useCallback(() => {
    setErrorCamara('')
    if (usarCamaraEnVivo) {
      setMostrarCamara(true)
      return
    }
    inputCamaraRef.current?.click()
  }, [usarCamaraEnVivo])

  const abrirGaleria = useCallback(() => {
    setErrorCamara('')
    setMostrarCamara(false)
    inputGaleriaRef.current?.click()
  }, [])

  const handleFotoDesdeArchivo = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setErrorCamara('Seleccioná una imagen válida.')
        return
      }

      try {
        const dataUrl = await leerImagenComoDataUrl(file)
        setFoto(dataUrl)
        setFotoArchivo(file)
        setMostrarCamara(false)
        setErrorCamara('')
      } catch {
        setErrorCamara('No se pudo cargar la foto. Intentá de nuevo.')
      }
    },
    []
  )

  const handleWebcamError = useCallback(() => {
    setMostrarCamara(false)
    setErrorCamara(
      'No se pudo acceder a la cámara. Usá “Tomar foto” o elegí una imagen de la galería.'
    )
    inputCamaraRef.current?.click()
  }, [])

  const handleFincaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const finca = fincas.find(f => f.id === id)
    setFincaSeleccionada(id)
    setFincaNombreSel(finca?.nombre ?? '')
  }

  const generarPDFBlob = (): Blob => {
    const validated = validateAccidentReport(buildInput())
    if (!validated.success) throw new Error(validated.reason)
    return buildAccidentReportPdf({
      operador: validated.data.operador,
      fincaNombre: validated.data.fincaNombre,
      tipo: validated.data.tipo,
      tarea: validated.data.tarea,
      afectadoNombre: validated.data.afectadoNombre,
      afectadoDni: validated.data.afectadoDni,
      partesCuerpo: validated.data.partesCuerpo,
      parteCuerpoOtro: validated.data.parteCuerpoOtro,
      naturalezasLesion: validated.data.naturalezasLesion,
      naturalezaLesionOtro: validated.data.naturalezaLesionOtro,
      descripcion: validated.data.descripcion,
      fecha: new Date(),
      foto,
    })
  }

  const validarFormulario = (): boolean => {
    const validated = validateAccidentReport(buildInput())
    if (!validated.success) {
      setError(validated.reason)
      showToast(validated.reason, 'error')
      return false
    }
    setError('')
    return true
  }

  const guardarEnFirestore = async (): Promise<boolean> => {
    try {
      await saveAccidentReport(buildInput())
      if (!navigator.onLine) {
        showToast('Informe guardado en el dispositivo. Se sincronizará al recuperar señal.', 'info')
      } else {
        showToast('Informe registrado en el sistema', 'success')
      }
      return true
    } catch (err) {
      console.error('Error al guardar informe:', err)
      showToast('No se pudo guardar el informe en Firestore. Podés continuar con el PDF.', 'error')
      return false
    }
  }

  const compartirPdfAdjunto = async (): Promise<'ok' | 'abort' | 'fallback'> => {
    const pdfBlob = generarPDFBlob()
    const fileName = accidentReportFileName(fincaNombreSel, new Date(), afectadoDni)
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

    if (!contextoSeguro) {
      setError(
        'Abrí la app con https:// (no http://). En la PC ejecutá scripts/generate-dev-certs.ps1, reiniciá npm run dev y en el iPhone entrá a https://TU-IP:5173/campo (aceptá el certificado una vez).'
      )
      return 'fallback'
    }

    if (!puedeCompartirArchivo(pdfFile)) {
      downloadBlob(pdfBlob, fileName)
      setError(
        'Este navegador no permite adjuntar el PDF automáticamente. Se descargó el archivo: en WhatsApp usá + → Documento.'
      )
      return 'fallback'
    }

    try {
      await navigator.share({ files: [pdfFile] })
      onSuccess('Elegí WhatsApp en el menú. El PDF del informe (con la foto) queda adjunto al mensaje.')
      return 'ok'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'abort'
      console.error('navigator.share PDF:', e)
    }

    downloadBlob(pdfBlob, fileName)
    setError(
      'No se abrió el menú para compartir. El PDF se descargó: en WhatsApp usá + → Documento.'
    )
    return 'fallback'
  }

  const compartirWhatsApp = async () => {
    if (!validarFormulario()) return

    setEnviando(true)
    setError('')

    try {
      await guardarEnFirestore()
      await compartirPdfAdjunto()
    } catch (err) {
      console.error('Error al compartir por WhatsApp:', err)
      setError('No se pudo generar el adjunto. Probá "Solo descargar PDF" y envialo manualmente.')
    } finally {
      setEnviando(false)
    }
  }

  const descargarPDF = async (blob?: Blob, nombre?: string) => {
    if (!validarFormulario()) return

    await guardarEnFirestore()
    const pdfBlob = blob ?? generarPDFBlob()
    const fileName = nombre ?? accidentReportFileName(fincaNombreSel, new Date(), afectadoDni)
    downloadBlob(pdfBlob, fileName)
    onSuccess('El PDF se descargó y el informe quedó registrado.')
  }

  const formularioValido = validateAccidentReport(buildInput()).success

  return (
    <div className="container fade-in">
      <div className="mobile-header accident-header">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={18} /> Volver al menú
        </button>
        <h1>
          <AlertTriangle size={22} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Informe de Accidente
        </h1>
        <p>Registrar un accidente</p>
      </div>

      {!contextoSeguro && (
        <div className="accident-error accident-https-hint">
          <AlertTriangle size={16} />
          Para enviar el PDF a WhatsApp necesitás abrir la app con <strong>https://</strong> en el celular.
        </div>
      )}

      <div className="card">
        <div className="card-title">Finca del hecho</div>
        <div className="form-group">
          <select
            className="form-select"
            value={fincaSeleccionada}
            onChange={handleFincaChange}
          >
            <option value="">Seleccionar finca...</option>
            {fincas.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Labor</div>
        <div className="form-group">
          <label className="form-label">Tipo de tarea</label>
          <select
            className="form-select"
            value={tipo}
            onChange={e => {
              setTipo(e.target.value as AccidenteTipoTarea | '')
              setTarea('')
            }}
          >
            <option value="">Seleccionar tipo...</option>
            <option value="manual">Manual</option>
            <option value="mecanica">Mecánica</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tarea</label>
          <select
            className="form-select"
            value={tarea}
            onChange={e => setTarea(e.target.value)}
            disabled={!tipo}
          >
            <option value="">{tipo ? 'Seleccionar tarea...' : 'Elegí el tipo primero'}</option>
            {(tipo === 'mecanica' ? tareasMecanicas : tipo === 'manual' ? tareasManuales : []).map(t => (
              <option key={`${tipo}-${t.id}`} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Operario afectado</div>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="form-input"
            value={afectadoNombre}
            onChange={e => setAfectadoNombre(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">DNI</label>
          <input
            className="form-input"
            value={afectadoDni}
            onChange={e => setAfectadoDni(e.target.value)}
            placeholder="Ej: 32456789"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
      </div>

      <ChecklistGroup
        title="Parte del cuerpo lesionada"
        items={PARTES_CUERPO}
        selected={partesCuerpo}
        otroTexto={parteCuerpoOtro}
        onToggle={id => {
          setPartesCuerpo(prev => {
            const next = toggleChecklistId(prev, id)
            if (!next.includes(ACCIDENTE_OTROS_ID)) setParteCuerpoOtro('')
            return next
          })
        }}
        onOtroChange={setParteCuerpoOtro}
      />

      <ChecklistGroup
        title="Naturaleza de la lesión"
        items={NATURALEZAS_LESION}
        selected={naturalezasLesion}
        otroTexto={naturalezaLesionOtro}
        onToggle={id => {
          setNaturalezasLesion(prev => {
            const next = toggleChecklistId(prev, id)
            if (!next.includes(ACCIDENTE_OTROS_ID)) setNaturalezaLesionOtro('')
            return next
          })
        }}
        onOtroChange={setNaturalezaLesionOtro}
      />

      <div className="card">
        <div className="card-title">Evidencia fotográfica</div>

        <input
          ref={inputCamaraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="camera-file-input"
          onChange={handleFotoDesdeArchivo}
          aria-hidden
          tabIndex={-1}
        />
        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          className="camera-file-input"
          onChange={handleFotoDesdeArchivo}
          aria-hidden
          tabIndex={-1}
        />

        {mostrarCamara && usarCamaraEnVivo && (
          <div className="camera-container">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={VIDEO_CONSTRAINTS}
              className="camera-preview"
              playsInline
              muted
              onUserMediaError={handleWebcamError}
            />
            <div className="camera-actions">
              <button className="btn btn-primary camera-btn" onClick={capturarFoto}>
                <Camera size={20} /> Capturar foto
              </button>
              <button
                className="btn btn-secondary camera-btn"
                onClick={() => setMostrarCamara(false)}
              >
                <X size={18} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {foto && !mostrarCamara && (
          <div className="photo-preview-container">
            <img src={foto} alt="Evidencia" className="photo-preview" />
            <div className="camera-actions">
              <button className="btn btn-secondary camera-btn" onClick={abrirCamara}>
                <RotateCcw size={16} /> Tomar otra
              </button>
              <button className="btn btn-secondary camera-btn" onClick={abrirGaleria}>
                <ImageIcon size={16} /> Galería
              </button>
              <button
                className="btn btn-secondary camera-btn"
                onClick={() => {
                  setFoto(null)
                  setFotoArchivo(null)
                }}
              >
                <X size={16} /> Eliminar
              </button>
            </div>
          </div>
        )}

        {!foto && !mostrarCamara && (
          <>
            <div className="camera-actions">
              <button className="btn btn-secondary camera-btn" onClick={abrirCamara}>
                <Camera size={18} /> Tomar foto
              </button>
              <button className="btn btn-secondary camera-btn" onClick={abrirGaleria}>
                <ImageIcon size={18} /> Galería
              </button>
            </div>
            {!usarCamaraEnVivo && (
              <p className="camera-hint">
                En el iPhone, “Tomar foto” abre la cámara; “Galería” deja elegir una imagen guardada.
              </p>
            )}
          </>
        )}

        {errorCamara && (
          <p className="camera-error-text">
            <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {errorCamara}
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-title">Descripción del accidente</div>
        <div className="form-group">
          <textarea
            className="form-input accident-textarea"
            placeholder="Describí cómo ocurrió el accidente..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={5}
          />
        </div>
      </div>

      {error && (
        <div className="accident-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="accident-actions">
        <button
          className="btn btn-whatsapp"
          onClick={compartirWhatsApp}
          disabled={!formularioValido || enviando}
          style={{ opacity: formularioValido && !enviando ? 1 : 0.5 }}
        >
          {enviando ? (
            <>
              <Loader size={18} className="spin-icon" /> Generando...
            </>
          ) : (
            <>
              <Share2 size={18} /> Enviar por WhatsApp (PDF adjunto)
            </>
          )}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => descargarPDF()}
          disabled={!formularioValido}
          style={{ opacity: formularioValido ? 1 : 0.5 }}
        >
          <Download size={18} /> Solo descargar PDF
        </button>
      </div>
    </div>
  )
}
