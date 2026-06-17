import { useState, useRef, useCallback, useMemo } from 'react'
import Webcam from 'react-webcam'
import { jsPDF } from 'jspdf'
import { ChevronLeft, Camera, RotateCcw, AlertTriangle, X, Loader, Share2, Download } from 'lucide-react'
import { fincas } from '../../data/catalog'
import { useMobileAppContext } from '../../contexts/MobileAppContext'
import { saveAccidentReport } from '../../utils/saveAccidentReport'
import { validateAccidentReport } from '../../validation/accidentReport'

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

function generarNombreArchivo(finca: string): string {
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '-')
  return `Informe_Accidente_${finca}_${fecha}.pdf`
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

export default function AccidentReportForm({
  operadorNombre,
  fincaId,
  fincaNombre,
  onBack,
  onSuccess,
}: Props) {
  const { showToast } = useMobileAppContext()
  const webcamRef = useRef<Webcam>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const usarCamaraEnVivo = useMemo(() => puedeUsarCamaraEnVivo(), [])
  const contextoSeguro = useMemo(() => window.isSecureContext, [])

  const [foto, setFoto] = useState<string | null>(null)
  const [, setFotoArchivo] = useState<File | null>(null)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fincaSeleccionada, setFincaSeleccionada] = useState(fincaId)
  const [fincaNombreSel, setFincaNombreSel] = useState(fincaNombre)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

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
    inputFotoRef.current?.click()
  }, [usarCamaraEnVivo])

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
      'No se pudo acceder a la cámara. Usá el botón para abrir la cámara del teléfono.'
    )
    inputFotoRef.current?.click()
  }, [])

  const handleFincaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const finca = fincas.find(f => f.id === id)
    setFincaSeleccionada(id)
    setFincaNombreSel(finca?.nombre ?? '')
  }

  const generarPDFBlob = (): Blob => {
    const doc = new jsPDF()
    const now = new Date()
    const fechaStr = now.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    doc.setFillColor(22, 101, 52)
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORME DE ACCIDENTE /\nCONDICIÓN RIESGOSA', 15, 18)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha: ${fechaStr}`, 15, 35)

    doc.setTextColor(0, 0, 0)
    let y = 55

    doc.setFillColor(240, 253, 244)
    doc.roundedRect(10, y - 5, 190, 30, 3, 3, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos del reporte', 15, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Reportado por: ${operadorNombre}`, 15, y + 12)
    doc.text(`Finca: ${fincaNombreSel}`, 15, y + 20)
    y += 40

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Descripción del hecho o condición insegura:', 15, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const lineas = doc.splitTextToSize(descripcion, 180)
    doc.text(lineas, 15, y)
    y += lineas.length * 5 + 10

    if (foto) {
      if (y + 90 > 280) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Evidencia fotográfica:', 15, y)
      y += 8
      doc.addImage(foto, 'JPEG', 15, y, 120, 80)
    }

    doc.setDrawColor(200, 200, 200)
    doc.line(10, 280, 200, 280)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Generado automáticamente por Sistema de Gestión de Campo', 105, 286, { align: 'center' })

    return doc.output('blob')
  }

  const validarFormulario = (): boolean => {
    const validated = validateAccidentReport({
      operador: operadorNombre,
      fincaId: fincaSeleccionada,
      fincaNombre: fincaNombreSel,
      descripcion,
      tieneFoto: Boolean(foto),
    })
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
      await saveAccidentReport({
        operador: operadorNombre,
        fincaId: fincaSeleccionada,
        fincaNombre: fincaNombreSel,
        descripcion,
        tieneFoto: Boolean(foto),
      })
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

  const descargarPdfBlob = (pdfBlob: Blob, fileName: string) => {
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /** Abre el menú del sistema con el PDF adjunto (foto incluida). Elegí WhatsApp en la lista. */
  const compartirPdfAdjunto = async (): Promise<'ok' | 'abort' | 'fallback'> => {
    const pdfBlob = generarPDFBlob()
    const fileName = generarNombreArchivo(fincaNombreSel)
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

    if (!contextoSeguro) {
      setError(
        'Abrí la app con https:// (no http://). En la PC ejecutá scripts/generate-dev-certs.ps1, reiniciá npm run dev y en el iPhone entrá a https://TU-IP:5173/campo (aceptá el certificado una vez).'
      )
      return 'fallback'
    }

    if (!puedeCompartirArchivo(pdfFile)) {
      descargarPdfBlob(pdfBlob, fileName)
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

    descargarPdfBlob(pdfBlob, fileName)
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
    const fileName = nombre ?? generarNombreArchivo(fincaNombreSel)
    descargarPdfBlob(pdfBlob, fileName)
    onSuccess('El PDF se descargó y el informe quedó registrado.')
  }

  const formularioValido = descripcion.trim() && fincaSeleccionada

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
        <p>Registrar accidente o condición riesgosa</p>
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
        <div className="card-title">Evidencia fotográfica</div>

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          capture="environment"
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
              <button
                className="btn btn-secondary camera-btn"
                onClick={abrirCamara}
              >
                <RotateCcw size={16} /> Tomar otra
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
            <button className="btn btn-secondary" onClick={abrirCamara}>
              <Camera size={18} /> Tomar foto
            </button>
            {!usarCamaraEnVivo && (
              <p className="camera-hint">
                En el iPhone se abrirá la cámara del sistema (funciona sin conexión segura).
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
        <div className="card-title">Descripción del hecho</div>
        <div className="form-group">
          <textarea
            className="form-input accident-textarea"
            placeholder="Describí el accidente o la condición riesgosa detectada..."
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
