import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextValue {
  user: User | null
  ready: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    user: null,
    ready: false,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setState({ user, ready: true, error: null })
        return
      }

      if (!navigator.onLine) {
        setState({
          user: null,
          ready: true,
          error:
            'Sin conexión. Abrí la app con internet al menos una vez para activarla en este dispositivo.',
        })
        return
      }

      try {
        await signInAnonymously(auth)
      } catch (err) {
        console.error('Firebase Auth:', err)
        setState({
          user: null,
          ready: true,
          error:
            'No se pudo iniciar sesión con Firebase. Habilitá Authentication → Inicio anónimo en la consola.',
        })
      }
    })

    return unsubscribe
  }, [])

  if (!state.ready) {
    return (
      <div className="auth-shell">
        <p>Conectando con Firebase…</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="auth-shell auth-shell--error">
        <p>{state.error}</p>
      </div>
    )
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
