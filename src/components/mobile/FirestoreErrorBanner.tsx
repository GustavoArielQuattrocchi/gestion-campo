interface Props {
  message: string
}

export default function FirestoreErrorBanner({ message }: Props) {
  return (
    <div
      className="dashboard-sidebar-error"
      role="alert"
      style={{ margin: '0 16px 16px' }}
    >
      <strong>Error de conexión</strong>
      <p style={{ margin: '6px 0 0', fontSize: 13 }}>{message}</p>
    </div>
  )
}
