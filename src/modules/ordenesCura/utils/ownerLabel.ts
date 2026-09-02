/** Muestra el usuario que cargó una OC o un turno (órdenes compartidas entre admins). */
export function formatOwnerLabel(email: string | undefined | null): string {
  const value = (email ?? '').trim()
  if (!value) return '—'
  const at = value.indexOf('@')
  return at > 0 ? value.slice(0, at) : value
}
