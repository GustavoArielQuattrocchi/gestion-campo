import { useCallback, useEffect, useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../../providers/AuthProvider'
import {
  createOrden,
  deleteOrden,
  getOrdenById,
  getOrdenes,
  replaceOrdenItems,
  updateOrden,
} from '../services/ordenesCuraService'
import {
  deleteProducto,
  ensureProductosEnCatalogo,
  getCatalogo,
  type ProductoCatalogo,
} from '../services/catalogoService'
import type { OrdenCura, OrdenCuraCreate, OrderItem } from '../types'
import { generateOcNumber } from '../utils/ocNumber'
import { computeDosisMaquinada, computeFactor } from '../utils/factor'
import { createOrdenPdfBlob, downloadOrdenPdf, exportOrdenCsv, type ItemExport, type OrdenExport } from '../utils/export'

export interface OrdenFormState {
  id: string | null
  oc: string
  fecha: string
  finca: string
  cultivo: string
  manejo: string
  tecnico: string
  tractorista: string
  tractor: string
  maquinaria: string
  vol_maquinaria: string
  vol_aplicacion: string
  cuartel: string
  indicaciones: string
}

export interface ItemRow {
  localId: string
  producto: string
  ia: string
  presentacion: string
  dosis_ha: string
  dosis_maquinada: string
  obs: string
}

export type ItemField = Exclude<keyof ItemRow, 'localId'>

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
    ia: '',
    presentacion: '',
    dosis_ha: '',
    dosis_maquinada: '',
    obs: '',
  }
}

function emptyForm(): OrdenFormState {
  return {
    id: null,
    oc: '',
    fecha: todayInput(),
    finca: '',
    cultivo: '',
    manejo: '',
    tecnico: '',
    tractorista: '',
    tractor: '',
    maquinaria: '',
    vol_maquinaria: '',
    vol_aplicacion: '',
    cuartel: '',
    indicaciones: '',
  }
}

export function useOrdenCuraEditor() {
  const { user, ready } = useAuth()
  const userId = user?.uid ?? ''

  const [form, setForm] = useState<OrdenFormState>(emptyForm)
  const [items, setItems] = useState<ItemRow[]>(() => [emptyRow()])
  const [ordenes, setOrdenes] = useState<OrdenCura[]>([])
  const [catalogo, setCatalogo] = useState<ProductoCatalogo[]>([])
  const [listadoOpen, setListadoOpen] = useState(false)
  const [catalogoOpen, setCatalogoOpen] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<{ url: string; oc: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)

  const factor = useMemo(
    () => computeFactor(Number(form.vol_maquinaria), Number(form.vol_aplicacion)),
    [form.vol_maquinaria, form.vol_aplicacion],
  )

  const refreshOrdenes = useCallback(async () => {
    if (!userId) return [] as OrdenCura[]
    const data = await getOrdenes(userId)
    setOrdenes(data)
    return data
  }, [userId])

  const refreshCatalogo = useCallback(async () => {
    const data = await getCatalogo()
    setCatalogo(data)
    return data
  }, [])

  useEffect(() => {
    if (!ready || !userId) return
    refreshOrdenes().catch(err => {
      console.error('[OrdenesCura] No se pudieron cargar las órdenes:', err)
      setBanner({
        type: 'error',
        text: 'No se pudieron cargar las órdenes. Verificá la conexión y que las reglas de Firestore estén desplegadas.',
      })
    })
    refreshCatalogo().catch(err => {
      console.error('[OrdenesCura] No se pudo cargar el catálogo:', err)
      setBanner({
        type: 'error',
        text: 'No se pudo cargar el catálogo de productos. Verificá las reglas de Firestore.',
      })
    })
  }, [ready, userId, refreshOrdenes, refreshCatalogo])

  // Recalcula dosis maquinada de cada fila cuando cambia el factor.
  useEffect(() => {
    setItems(prev =>
      prev.map(row => ({ ...row, dosis_maquinada: computeDosisMaquinada(row.dosis_ha, factor) })),
    )
  }, [factor])

  const setField = useCallback(
    (field: keyof Omit<OrdenFormState, 'id'>, value: string) => {
      setForm(prev => {
        const next = { ...prev, [field]: value }
        if (field === 'finca' && !prev.id) {
          next.oc = value.trim() ? generateOcNumber(ordenes, value.trim()) : ''
        }
        return next
      })
    },
    [ordenes],
  )

  const updateItem = useCallback(
    (localId: string, field: ItemField, value: string) => {
      setItems(prev =>
        prev.map(row => {
          if (row.localId !== localId) return row
          const next = { ...row, [field]: value }
          if (field === 'dosis_ha') {
            next.dosis_maquinada = computeDosisMaquinada(value, factor)
          }
          return next
        }),
      )
    },
    [factor],
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
    setForm(emptyForm())
    setItems([emptyRow()])
    setBanner(null)
  }, [])

  // Recalcula el N° OC cuando cargan las órdenes y ya hay finca elegida (orden nueva).
  useEffect(() => {
    setForm(prev => {
      if (prev.id || !prev.finca.trim()) return prev
      const nextOc = generateOcNumber(ordenes, prev.finca)
      return prev.oc === nextOc ? prev : { ...prev, oc: nextOc }
    })
  }, [ordenes])

  const buildExport = useCallback((): { orden: OrdenExport; items: ItemExport[] } => {
    const orden: OrdenExport = {
      oc: form.oc,
      fecha: form.fecha,
      finca: form.finca,
      cultivo: form.cultivo,
      manejo: form.manejo,
      tecnico: form.tecnico,
      tractorista: form.tractorista,
      tractor: form.tractor,
      maquinaria: form.maquinaria,
      volMaquinaria: form.vol_maquinaria,
      volAplicacion: form.vol_aplicacion,
      cuartel: form.cuartel,
      indicaciones: form.indicaciones,
    }
    const exportItems: ItemExport[] = items
      .filter(row => row.producto.trim() || row.ia.trim())
      .map(row => ({
        producto: row.producto,
        ia: row.ia,
        presentacion: row.presentacion,
        dosis_ha: row.dosis_ha,
        dosis_maquinada: row.dosis_maquinada,
        obs: row.obs,
      }))
    return { orden, items: exportItems }
  }, [form, items])

  const guardar = useCallback(async () => {
    if (!userId) {
      setBanner({ type: 'error', text: 'No hay sesión activa de Firebase.' })
      return
    }
    if (!form.finca) {
      setBanner({ type: 'error', text: 'Seleccioná una finca antes de guardar.' })
      return
    }

    setSaving(true)
    try {
      const data: OrdenCuraCreate = {
        owner_id: userId,
        oc: form.oc,
        fecha: inputToTs(form.fecha),
        finca: form.finca,
        cultivo: form.cultivo,
        manejo: form.manejo,
        tecnico: form.tecnico,
        tractorista: form.tractorista,
        tractor: form.tractor,
        maquinaria: form.maquinaria,
        vol_maquinaria: Number(form.vol_maquinaria) || 0,
        vol_aplicacion: Number(form.vol_aplicacion) || 0,
        cuartel: form.cuartel,
        indicaciones: form.indicaciones,
      }

      const itemPayload: OrderItem[] = items
        .filter(row => row.producto.trim() || row.ia.trim())
        .map(row => ({
          id: '',
          producto: row.producto.trim(),
          ia: row.ia.trim(),
          presentacion: row.presentacion.trim(),
          dosis_ha: row.dosis_ha.trim(),
          dosis_maquinada: row.dosis_maquinada.trim(),
          obs: row.obs.trim(),
        }))

      if (form.id) {
        await updateOrden(form.id, data)
        await replaceOrdenItems(form.id, itemPayload)
      } else {
        const newId = await createOrden(data, itemPayload)
        setForm(prev => ({ ...prev, id: newId }))
      }

      await ensureProductosEnCatalogo(
        itemPayload.map(item => ({ nombre: item.producto, ia: item.ia, presentacion: item.presentacion })),
      )

      await Promise.all([refreshOrdenes(), refreshCatalogo()])
      setBanner({ type: 'success', text: `Orden ${form.oc} guardada.` })
    } catch (err) {
      console.error('[OrdenesCura] Error al guardar:', err)
      setBanner({ type: 'error', text: 'No se pudo guardar la orden. Revisá la conexión y las reglas de Firestore.' })
    } finally {
      setSaving(false)
    }
  }, [userId, form, items, refreshOrdenes, refreshCatalogo])

  const abrirOrden = useCallback(async (ordenId: string) => {
    try {
      const orden = await getOrdenById(ordenId)
      setForm({
        id: orden.id,
        oc: orden.oc,
        fecha: tsToInput(orden.fecha),
        finca: orden.finca,
        cultivo: orden.cultivo,
        manejo: orden.manejo,
        tecnico: orden.tecnico,
        tractorista: orden.tractorista,
        tractor: orden.tractor,
        maquinaria: orden.maquinaria,
        vol_maquinaria: orden.vol_maquinaria ? String(orden.vol_maquinaria) : '',
        vol_aplicacion: orden.vol_aplicacion ? String(orden.vol_aplicacion) : '',
        cuartel: orden.cuartel,
        indicaciones: orden.indicaciones,
      })
      setItems(
        orden.items.length > 0
          ? orden.items.map(item => ({ localId: newLocalId(), ...itemToRow(item) }))
          : [emptyRow()],
      )
      setListadoOpen(false)
      setBanner(null)
    } catch (err) {
      console.error('[OrdenesCura] Error al abrir la orden:', err)
      setBanner({ type: 'error', text: 'No se pudo abrir la orden.' })
    }
  }, [])

  const eliminarOrden = useCallback(
    async (ordenId: string) => {
      try {
        await deleteOrden(ordenId)
        const updated = await refreshOrdenes()
        if (form.id === ordenId) {
          const finca = form.finca.trim()
          setForm({
            ...emptyForm(),
            ...(finca ? { finca, oc: generateOcNumber(updated, finca) } : {}),
          })
          setItems([emptyRow()])
        }
        setBanner({ type: 'success', text: 'Orden eliminada.' })
      } catch (err) {
        console.error('[OrdenesCura] Error al eliminar:', err)
        setBanner({ type: 'error', text: 'No se pudo eliminar la orden.' })
      }
    },
    [refreshOrdenes, form.id, form.finca],
  )

  const eliminarProducto = useCallback(
    async (productoId: string) => {
      try {
        await deleteProducto(productoId)
        await refreshCatalogo()
      } catch (err) {
        console.error('[OrdenesCura] Error al eliminar producto:', err)
      }
    },
    [refreshCatalogo],
  )

  const exportarPdf = useCallback(() => {
    const data = buildExport()
    const blob = createOrdenPdfBlob(data.orden, data.items)
    const url = URL.createObjectURL(blob)
    setPdfPreview(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return { url, oc: data.orden.oc }
    })
  }, [buildExport])

  const cerrarVistaPdf = useCallback(() => {
    setPdfPreview(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const descargarPdf = useCallback(() => {
    const data = buildExport()
    downloadOrdenPdf(data.orden, data.items)
  }, [buildExport])

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
    factor,
    saving,
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
    eliminarOrden,
    eliminarProducto,
    exportarPdf,
    exportarExcel,
  }
}

function itemToRow(item: OrderItem): Omit<ItemRow, 'localId'> {
  return {
    producto: item.producto,
    ia: item.ia,
    presentacion: item.presentacion,
    dosis_ha: item.dosis_ha,
    dosis_maquinada: item.dosis_maquinada,
    obs: item.obs,
  }
}
