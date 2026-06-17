export type FirestoreErrorInfo = {
  kind: 'index' | 'generic'
  message: string
  indexCreateUrl: string | null
}

export function parseFirestoreError(raw: string): FirestoreErrorInfo {
  const indexUrlMatch = raw.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
  const needsIndex =
    raw.includes('requires an index') ||
    raw.includes('FAILED_PRECONDITION') ||
    Boolean(indexUrlMatch)

  if (needsIndex) {
    return {
      kind: 'index',
      message:
        'Firestore necesita un índice compuesto para la combinación de filtros actual. Creá el índice desde el enlace de abajo y esperá 1–2 minutos a que termine de construirse.',
      indexCreateUrl: indexUrlMatch?.[0] ?? null,
    }
  }

  return {
    kind: 'generic',
    message: raw,
    indexCreateUrl: null,
  }
}
