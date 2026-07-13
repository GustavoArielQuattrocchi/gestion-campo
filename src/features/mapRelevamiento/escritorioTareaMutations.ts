import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { RendimientoUnidad, TareaTipo } from '../../types'
import {
  buildManualTaskFirestorePayload,
  buildMechanicalTaskFirestorePayload,
} from '../../utils/mobileTaskPayloads'
import { formatRendimiento } from '../../utils/rendimiento'
import {
  buildEjecutorPorCuadroPatch,
  ejecutorLabelFromContinueOptions,
  mergeEjecutorPorCuadro,
  type ContinueTaskOptions,
} from '../../utils/tareaEjecutor'
import {
  validateManualTaskCreate,
  validateMechanicalTaskCreate,
  type ManualTaskCreateInput,
  type MechanicalTaskCreateInput,
} from '../../validation/tareaCreate'
import { ESCRITORIO_OPERADOR } from './config'

export interface EscritorioTareaContext {
  fincaId: string
  fincaNombre: string
}

function escritorioCtx(ctx: EscritorioTareaContext) {
  return {
    fincaId: ctx.fincaId,
    fincaNombre: ctx.fincaNombre,
    operadorNombre: ESCRITORIO_OPERADOR,
    fechaInicio: Timestamp.now(),
  }
}

export async function crearTareaManualEscritorio(
  input: ManualTaskCreateInput,
  ctx: EscritorioTareaContext,
): Promise<string> {
  const validated = validateManualTaskCreate(input)
  if (!validated.success) throw new Error(validated.reason)

  const payload = buildManualTaskFirestorePayload(validated.data, escritorioCtx(ctx))
  const docRef = await addDoc(collection(db, 'tareas'), payload)
  return docRef.id
}

export async function crearTareaMecanicaEscritorio(
  input: MechanicalTaskCreateInput,
  ctx: EscritorioTareaContext,
): Promise<string> {
  const validated = validateMechanicalTaskCreate(input)
  if (!validated.success) throw new Error(validated.reason)

  const payload = buildMechanicalTaskFirestorePayload(validated.data, escritorioCtx(ctx))
  const docRef = await addDoc(collection(db, 'tareas'), payload)
  return docRef.id
}

export async function agregarCuadroATareaEscritorio(
  tareaId: string,
  cuadros: string[],
  cuadroIds: string[],
  options: ContinueTaskOptions = {},
): Promise<void> {
  const ref = doc(db, 'tareas', tareaId)
  const snap = await getDoc(ref)
  const data = snap.data()
  const tipo = (data?.tipo as TareaTipo | undefined) ?? 'manual'
  const existingEjecutor = data?.ejecutorPorCuadro as Record<string, string> | undefined

  const updates: Record<string, unknown> = {
    cuadros: arrayUnion(...cuadros),
    cuadroIds: arrayUnion(...cuadroIds),
  }

  const ejecutorLabel = ejecutorLabelFromContinueOptions(tipo, options)
  if (ejecutorLabel) {
    const patch = buildEjecutorPorCuadroPatch(cuadroIds, ejecutorLabel)
    updates.ejecutorPorCuadro = mergeEjecutorPorCuadro(existingEjecutor, patch)
  }

  if (options.cantidadPersonas !== undefined) {
    const actual = typeof data?.cantidadPersonas === 'number' ? data.cantidadPersonas : 0
    updates.cantidadPersonas = Math.max(actual, options.cantidadPersonas)
  }

  await updateDoc(ref, updates)
}

export interface RendimientoEscritorioInput {
  cantidad: number
  unidad: RendimientoUnidad
  cuadroId: string
}

export async function finalizarCuadroEscritorio(
  tareaId: string,
  cuadroId: string,
  rendimiento?: RendimientoEscritorioInput,
): Promise<void> {
  await updateDoc(doc(db, 'tareas', tareaId), {
    cuadroIdsFinalizados: arrayUnion(cuadroId),
    cuadroFinalizaciones: arrayUnion({
      cuadroId,
      fecha: Timestamp.now(),
      operador: ESCRITORIO_OPERADOR,
    }),
  })

  if (!rendimiento || !Number.isFinite(rendimiento.cantidad) || rendimiento.cantidad <= 0) {
    return
  }

  const texto = formatRendimiento(rendimiento.cantidad, rendimiento.unidad)
  const entry = {
    fecha: Timestamp.now(),
    texto,
    operador: ESCRITORIO_OPERADOR,
    cantidad: rendimiento.cantidad,
    unidad: rendimiento.unidad,
    rendimientoPorCuadro: { [rendimiento.cuadroId]: rendimiento.cantidad },
  }

  await updateDoc(doc(db, 'tareas', tareaId), {
    rendimientosDiarios: arrayUnion(entry),
    rendimiento: texto,
  })
}
