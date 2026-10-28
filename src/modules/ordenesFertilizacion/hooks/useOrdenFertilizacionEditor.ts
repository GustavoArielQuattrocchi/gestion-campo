import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../../providers/AuthProvider'
import { getOrdenes as getOrdenesCura } from '../../ordenesCura/services/ordenesCuraService'
import {
  createProductoExtra,
  deleteProducto,
  ensureExtrasEnCatalogo,
  getCatalogo,
  type ProductoCatalogo,
  type ProductoCatalogoAlta,
} from '../../ordenesCura/services/catalogoService'
import { findProductoCatalogo, catalogoDesdeArchivo } from '../../../data/agroQuimicos'
import { canonicalizarProducto, formatDosisHaCanon } from '../../../data/productoCatalogoAlias'
import type { OrdenNumeroRef } from '../../ordenesCura/utils/ocNumber'
import { generateOrdenNumber } from '../../ordenesCura/utils/ocNumber'
import { parseLeadingNumber } from '../../ordenesCura/utils/factor'
import type {
  OrdenFertilizacion,
  OrdenFertilizacionCreate,
  OrdenFertilizacionItem,
} from '../types'
import {
  createOrden,
  deleteOrden,
  getOrdenById,
  getOrdenes,
  updateOrdenConItems,
} from '../services/ordenesFertilizacionService'
import { computeDosisAplicacion } from '../utils/dosis'
import {
  createOrdenPdfBlob,
  downloadPdfBlob,
  exportOrdenCsv,
  ordenGuardadaToExport,
  type ItemExport,
  type OrdenExport,
} from '../utils/export'

export interface OrdenFormState {
  id: string | null
  of: string
  fecha: string
  finca: string
  cultivo: string
  manejo: string
  tecnico: string
  responsable: string
  cuartel: string
  indicaciones: string
}

export interface ItemRow {
  localId: string
  producto: string
  grupo: string
  ia: string
  presentacion: string
  dosis_ha: string
  superficie: string
  dosis_aplicacion: string
  obs: string
}

export type ItemField = Exclude<keyof ItemRow, 'localId' | 'dosis_aplicacion'>

type Banner = { type: 'success' | 'error'; text: string } | null

function todayInput(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

function tsToInput(ts: Timestamp): string {
  const d = ts.toDate()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function inputToTs(value: string): Timestamp {
  if (!value) return Timestamp.now()
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? Timestamp.now() : Timestamp.fromDate(d)
}

function newLocalId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emptyRow(): ItemRow {
  return {
    localId: newLocalId(),
    producto: '',
    grupo: '',
    ia: '',
    presentacion: '',
    dosis_ha: '',
    superficie: '',
    dosis_aplicacion: '',
    obs: '',
  }
}

function emptyForm(): OrdenFormState {
  return {
    id: null,
    of: '',
    fecha: todayInput(),
    finca: '',
    cultivo: '',
    manejo: '',
    tecnico: '',
    responsable: '',
    cuartel: '',
    indicaciones: '',
  }
}

export function useOrdenFertilizacionEditor() {
  const { user, ready } = useAuth()
  const userId = user?.uid ?? ''

  const [form, setForm] = useState<OrdenFormState>(emptyForm)
  const [items, setItems] = useState<ItemRow[]>(() => [emptyRow()])
  const [ordenes, setOrdenes] = useState<OrdenFertilizacion[]>([])
  const [codigosCura, setCodigosCura] = useState<OrdenNumeroRef[]>([])
  const [catalogo, setCatalogo] = useState<ProductoCatalogo[]>(() => catalogoDesdeArchivo())
  const [listadoOpen, setListadoOpen] = useState(false)
  const [catalogoOpen, setCatalogoOpen] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<{ url: string; of: string; blob: Blob } | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [readOnly, setReadOnly] = useState(false)
  const [busyPdfId, setBusyPdfId] = useState<string | null>(null)
  const [banner, setBanner] = useState<Banner>(null)

  const codigosNumero = useMemo(
    () => [
      ...codigosCura,
      ...ordenes.map(orden => ({ codigo: orden.of, finca: orden.finca })),
    ],
    [codigosCura, ordenes],
  )

  const refreshOrdenes = useCallback(async () => {
    if (!userId) return [] as OrdenFertilizacion[]
    const data = await getOrdenes()
    setOrdenes(data)
    return data
  }, [userId])

  const refreshCodigosCura = useCallback(async () => {
    try {
      const data = await getOrdenesCura()
      setCodigosCura(data.map(orden => ({ codigo: orden.oc, finca: orden.finca })))
    } catch (err) {
      console.error('[OrdenesFertilizacion] No se pudieron leer las curas para el número:', err)
    }
  }, [])

  const refreshCatalogo = useCallback(async () => {
    const data = await getCatalogo()
    setCatalogo(data)
    return data
  }, [])

  useEffect(() => {
    if (!ready || !userId) return
    refreshOrdenes().catch(err => {
      console.error('[OrdenesFertilizacion] No se pudieron cargar las órdenes:', err)
      setBanner({
        type: 'error',
        text: 'No se pudieron cargar las órdenes. Verificá la conexión y que las reglas de Firestore estén desplegadas.',
      })
    })
    refreshCatalogo().catch(err => {
      console.error('[OrdenesFertilizacion] No se pudo cargar el catálogo:', err)
      setBanner({
        type: 'error',
        text: 'No se pudo cargar el catálogo de productos. Verificá las reglas de Firestore.',
      })
    })
    void refreshCodigosCura()
  }, [ready, userId, refreshOrdenes, refreshCatalogo, refreshCodigosCura])

  const setField = useCallback(
    (field: keyof Omit<OrdenFormState, 'id'>, value: string) => {
      setForm(prev => {
        const next = { ...prev, [field]: value }
        if (field === 'finca' && !prev.id) {
          next.of = value.trim() ? generateOrdenNumber(codigosNumero, value.trim(), 'OF') : ''
        }
        return next
      })
    },
    [codigosNumero],
  )

  const updateItem = useCallback(
    (localId: string, field: ItemField, value: string) => {
      setItems(prev =>
        prev.map(row => {
          if (row.localId !== localId) return row
          const next = { ...row, [field]: value }
          if (field === 'producto') {
            const match = findProductoCatalogo(catalogo, value)
            if (match) {
              const canon = canonicalizarProducto(
                {
                  nombre: value,
                  presentacion: next.presentacion,
                  ia: next.ia,
                  dosisHa: parseLeadingNumber(next.dosis_ha),
                },
                catalogo,
              )
              next.producto = match.nombre
              next.ia = match.ia
              next.grupo = match.categoria
              next.presentacion = canon.presentacion
              next.dosis_ha = formatDosisHaCanon(next.dosis_ha, canon)
              if (match.dosis_ha && !next.dosis_ha.trim()) next.dosis_ha = match.dosis_ha
            } else if (!value.trim()) {
              next.grupo = ''
            }
          }
          if (field === 'dosis_ha' || field === 'superficie' || field === 'producto') {
            next.dosis_aplicacion = computeDosisAplicacion(next.dosis_ha, next.superficie)
          }
          return next
        }),
      )
    },
    [catalogo],
  )

  const addItem = useCallback(() => {
    setItems(prev => [...prev, emptyRow()])
  }, [])

  const removeItem = useCallback((localId: string) => {
    setItems(prev => {
      const next = prev.filter(row => row.localId !== localId)
      return next.length > 0 ? next : [emptyRow()]
    })
  }, [])

  const clearItems = useCallback(() => {
    setItems([emptyRow()])
  }, [])

  const nueva = useCallback(() => {
    setReadOnly(false)
    setForm(emptyForm())
    setItems([emptyRow()])
    setBanner(null)
  }, [])

  useEffect(() => {
    setForm(prev => {
      if (prev.id || !prev.finca.trim()) return prev
      const nextOf = generateOrdenNumber(codigosNumero, prev.finca, 'OF')
      return prev.of === nextOf ? prev : { ...prev, of: nextOf }
    })
  }, [codigosNumero])

  const buildExport = useCallback((): { orden: OrdenExport; items: ItemExport[] } => {
    const orden: OrdenExport = {
      of: form.of,
      fecha: form.fecha,
      finca: form.finca,
      cultivo: form.cultivo,
      manejo: form.manejo,
      tecnico: form.tecnico,
      responsable: form.responsable,
      cuartel: form.cuartel,
      indicaciones: form.indicaciones,
    }
    const exportItems: ItemExport[] = items
      .filter(row => row.producto.trim() || row.ia.trim())
      .map(row => ({
        producto: row.producto,
        grupo: row.grupo,
        ia: row.ia,
        presentacion: row.presentacion,
        dosis_ha: row.dosis_ha,
        superficie: row.superficie,
        dosis_aplicacion: computeDosisAplicacion(row.dosis_ha, row.superficie),
        obs: row.obs,
      }))
    return { orden, items: exportItems }
  }, [form, items])

  const guardar = useCallback(async () => {
    if (readOnly || savingRef.current) return
    if (!userId) {
      setBanner({ type: 'error', text: 'No hay sesión activa de Firebase.' })
      return
    }
    if (!form.finca) {
      setBanner({ type: 'error', text: 'Seleccioná una finca antes de guardar.' })
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      const data: OrdenFertilizacionCreate = {
        owner_id: userId,
        owner_email: user?.email ?? '',
        of: form.of,
        fecha: inputToTs(form.fecha),
        finca: form.finca,
        cultivo: form.cultivo,
        manejo: form.manejo,
        tecnico: form.tecnico,
        responsable: form.responsable,
        cuartel: form.cuartel,
        indicaciones: form.indicaciones,
      }

      const itemPayload: OrdenFertilizacionItem[] = items
        .filter(row => row.producto.trim() || row.ia.trim())
        .map(row => ({
          id: '',
          producto: row.producto.trim(),
          grupo: row.grupo.trim(),
          ia: row.ia.trim(),
          presentacion: row.presentacion.trim(),
          dosis_ha: row.dosis_ha.trim(),
          superficie: row.superficie.trim(),
          dosis_aplicacion: computeDosisAplicacion(row.dosis_ha, row.superficie),
          obs: row.obs.trim(),
        }))

      const nuevos = items.filter(row => {
        const nombre = row.producto.trim()
        if (!nombre) return false
        return !findProductoCatalogo(catalogo, nombre)
      })
      if (nuevos.some(row => !row.grupo.trim())) {
        setBanner({
          type: 'error',
          text: 'Hay productos nuevos: elegí el grupo (Fungicida, Herbicida, etc.) antes de guardar.',
        })
        return
      }

      if (form.id) {
        await updateOrdenConItems(form.id, data, itemPayload)
      } else {
        const newId = await createOrden(data, itemPayload)
        setForm(prev => ({ ...prev, id: newId }))
      }

      await ensureExtrasEnCatalogo(
        nuevos.map(row => ({
          categoria: row.grupo.trim(),
          nombre: row.producto.trim(),
          ia: row.ia.trim(),
          presentacion: row.presentacion.trim(),
          dosis_ha: row.dosis_ha.trim(),
          description: '',
          management: '',
        })),
        catalogo,
      )

      await Promise.all([refreshOrdenes(), refreshCatalogo(), refreshCodigosCura()])
      setBanner({ type: 'success', text: `Orden ${form.of} guardada.` })
    } catch (err) {
      console.error('[OrdenesFertilizacion] Error al guardar:', err)
      setBanner({
        type: 'error',
        text: 'No se pudo guardar la orden. Revisá la conexión y las reglas de Firestore.',
      })
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [readOnly, userId, user?.email, form, items, catalogo, refreshOrdenes, refreshCatalogo, refreshCodigosCura])

  const abrirOrden = useCallback(async (ordenId: string) => {
    try {
      const orden = await getOrdenById(ordenId)
      setReadOnly(true)
      setForm({
        id: orden.id,
        of: orden.of,
        fecha: tsToInput(orden.fecha),
        finca: orden.finca,
        cultivo: orden.cultivo,
        manejo: orden.manejo,
        tecnico: orden.tecnico,
        responsable: orden.responsable,
        cuartel: orden.cuartel,
        indicaciones: orden.indicaciones,
      })
      setItems(
        orden.items.length > 0
          ? orden.items.map(item => ({ localId: newLocalId(), ...itemToRow(item, catalogo) }))
          : [emptyRow()],
      )
      setListadoOpen(false)
      setBanner({
        type: 'success',
        text: `Estás viendo ${orden.of} (solo lectura). Usá Nueva para cargar otra orden.`,
      })
    } catch (err) {
      console.error('[OrdenesFertilizacion] Error al abrir la orden:', err)
      setBanner({ type: 'error', text: 'No se pudo abrir la orden.' })
    }
  }, [catalogo])

  const eliminarOrden = useCallback(
    async (ordenId: string) => {
      const objetivo = ordenes.find(o => o.id === ordenId)
      const ok = window.confirm(
        `¿Eliminar la orden ${objetivo?.of ?? ''}? Esta acción no se puede deshacer.`,
      )
      if (!ok) return
      try {
        await deleteOrden(ordenId)
        await Promise.all([refreshOrdenes(), refreshCodigosCura()])
        if (form.id === ordenId) {
          setReadOnly(false)
          setForm(emptyForm())
          setItems([emptyRow()])
        }
        setBanner({ type: 'success', text: 'Orden eliminada.' })
      } catch (err) {
        console.error('[OrdenesFertilizacion] Error al eliminar:', err)
        setBanner({ type: 'error', text: 'No se pudo eliminar la orden.' })
      }
    },
    [refreshOrdenes, refreshCodigosCura, form.id, ordenes],
  )

  const eliminarProducto = useCallback(
    async (productoId: string) => {
      try {
        await deleteProducto(productoId)
        await refreshCatalogo()
      } catch (err) {
        console.error('[OrdenesFertilizacion] Error al eliminar producto:', err)
      }
    },
    [refreshCatalogo],
  )

  const agregarProducto = useCallback(
    async (input: ProductoCatalogoAlta) => {
      await createProductoExtra(input, catalogo)
      await refreshCatalogo()
    },
    [catalogo, refreshCatalogo],
  )

  const mostrarPdf = useCallback((blob: Blob, of: string) => {
    const url = URL.createObjectURL(blob)
    setPdfPreview(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return { url, of, blob }
    })
  }, [])

  const exportarPdf = useCallback(async () => {
    const data = buildExport()
    mostrarPdf(await createOrdenPdfBlob(data.orden, data.items), data.orden.of)
  }, [buildExport, mostrarPdf])

  const vistaPdfOrden = useCallback(async (ordenId: string) => {
    setBusyPdfId(ordenId)
    try {
      const orden = await getOrdenById(ordenId)
      const data = ordenGuardadaToExport(orden)
      mostrarPdf(await createOrdenPdfBlob(data.orden, data.items), data.orden.of)
    } catch (err) {
      console.error('[OrdenesFertilizacion] Error al generar PDF:', err)
      setBanner({ type: 'error', text: 'No se pudo generar el PDF de esa orden.' })
    } finally {
      setBusyPdfId(null)
    }
  }, [mostrarPdf])

  const cerrarVistaPdf = useCallback(() => {
    setPdfPreview(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const descargarPdf = useCallback(async () => {
    if (pdfPreview) {
      downloadPdfBlob(pdfPreview.blob, pdfPreview.of)
      return
    }
    const data = buildExport()
    downloadPdfBlob(await createOrdenPdfBlob(data.orden, data.items), data.orden.of)
  }, [pdfPreview, buildExport])

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url)
    }
  }, [pdfPreview?.url])

  const exportarExcel = useCallback(() => {
    const data = buildExport()
    exportOrdenCsv(data.orden, data.items)
  }, [buildExport])

  return {
    form,
    items,
    ordenes,
    catalogo,
    saving,
    readOnly,
    busyPdfId,
    banner,
    listadoOpen,
    catalogoOpen,
    pdfPreview,
    setListadoOpen,
    setCatalogoOpen,
    cerrarVistaPdf,
    descargarPdf,
    setField,
    updateItem,
    addItem,
    removeItem,
    clearItems,
    nueva,
    guardar,
    abrirOrden,
    vistaPdfOrden,
    eliminarOrden,
    eliminarProducto,
    agregarProducto,
    exportarPdf,
    exportarExcel,
  }
}

function itemToRow(
  item: OrdenFertilizacionItem,
  catalogo: ProductoCatalogo[],
): Omit<ItemRow, 'localId'> {
  const canon = canonicalizarProducto(
    {
      nombre: item.producto,
      presentacion: item.presentacion,
      ia: item.ia,
      dosisHa: parseLeadingNumber(item.dosis_ha),
    },
    catalogo,
  )
  const dosisHa = formatDosisHaCanon(item.dosis_ha, canon)
  const grupo = item.grupo || findProductoCatalogo(catalogo, canon.nombre)?.categoria || ''
  return {
    producto: canon.nombre,
    grupo,
    ia: canon.ia || item.ia,
    presentacion: canon.presentacion,
    dosis_ha: dosisHa,
    superficie: item.superficie,
    dosis_aplicacion: computeDosisAplicacion(dosisHa, item.superficie),
    obs: item.obs,
  }
}
