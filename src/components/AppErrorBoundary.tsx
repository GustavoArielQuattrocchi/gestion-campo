import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Evita que un throw de render deje #root vacío. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="auth-shell auth-shell--error">
        <p>La aplicación tuvo un error inesperado.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    )
  }
}
