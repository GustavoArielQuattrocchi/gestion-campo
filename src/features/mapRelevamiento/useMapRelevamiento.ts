import { useCallback, useState } from 'react'
import type { Tarea } from '../../types'
import type { ContinueTaskOptions } from '../../utils/tareaEjecutor'
import type { ManualTaskCreateInput, MechanicalTaskCreateInput } from '../../validation/tareaCreate'
import {
  agregarCuadroATareaEscritorio,
  crearTareaManualEscritorio,
  crearTareaMecanicaEscritorio,
  finalizarCuadroEscritorio,
  type EscritorioTareaContext,
  type RendimientoEscritorioInput,
} from './escritorioTareaMutations'

export function useMapRelevamiento(_allTareas: Tarea[]) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async <T>(fn: () => Promise<T>, errorMsg: string): Promise<T | null> => {
    setActionError(null)
    setBusy(true)
    try {
      return await fn()
    } catch (err) {
      console.error('[mapRelevamiento]', errorMsg, err)
      setActionError(err instanceof Error ? err.message : errorMsg)
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  const crearManual = useCallback(
    (input: ManualTaskCreateInput, ctx: EscritorioTareaContext) =>
      run(
        () => crearTareaManualEscritorio(input, ctx),
        'No se pudo crear la tarea manual. Revisá la conexión y las reglas de Firestore.',
      ),
    [run],
  )

  const crearMecanica = useCallback(
    (input: MechanicalTaskCreateInput, ctx: EscritorioTareaContext) =>
      run(
        () => crearTareaMecanicaEscritorio(input, ctx),
        'No se pudo crear la tarea mecánica. Revisá la conexión y las reglas de Firestore.',
      ),
    [run],
  )

  const continuarTarea = useCallback(
    (
      tareaId: string,
      cuadros: string[],
      cuadroIds: string[],
      options?: ContinueTaskOptions,
    ) =>
      run(
        () => agregarCuadroATareaEscritorio(tareaId, cuadros, cuadroIds, options),
        'No se pudo agregar el cuadro a la tarea existente.',
      ),
    [run],
  )

  const finalizarCuadro = useCallback(
    (tareaId: string, cuadroId: string, rendimiento?: RendimientoEscritorioInput) =>
      run(
        () => finalizarCuadroEscritorio(tareaId, cuadroId, rendimiento),
        'No se pudo finalizar el cuadro. Revisá la conexión y las reglas de Firestore.',
      ),
    [run],
  )

  const clearError = useCallback(() => setActionError(null), [])

  return {
    busy,
    actionError,
    clearError,
    crearManual,
    crearMecanica,
    continuarTarea,
    finalizarCuadro,
  }
}

export type MapRelevamientoActions = ReturnType<typeof useMapRelevamiento>
