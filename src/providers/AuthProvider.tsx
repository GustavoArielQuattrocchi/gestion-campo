import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'

/** Dominio de correo autorizado para administradores del escritorio. */
export const ADMIN_EMAIL_DOMAIN = 'salentein.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

/** Un usuario es admin si tiene sesión con contraseña, dominio autorizado y email verificado. */
export function isAdminUser(user: User | null): boolean {
  return (
    !!user &&
    !user.isAnonymous &&
    isAdminEmail(user.email) &&
    user.emailVerified
  )
}

function isAdminRoute(): boolean {
  const path = window.location.pathname
  return path.startsWith('/escritorio') || path.startsWith('/ordenes-de-cura')
}

const AUTH_INIT_TIMEOUT_MS = 12_000

interface AuthContextValue {
  user: User | null
  ready: boolean
  error: string | null
  isAdmin: boolean
  loginAdmin: (email: string, password: string) => Promise<void>
  registerAdmin: (email: string, password: string) => Promise<void>
  resendVerification: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  error: null,
  isAdmin: false,
  loginAdmin: async () => {},
  registerAdmin: async () => {},
  resendVerification: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; ready: boolean; error: string | null }>({
    user: null,
    ready: false,
    error: null,
  })

  useEffect(() => {
    let settled = false

    const timeout = window.setTimeout(() => {
      if (settled) return
      setState(current =>
        current.ready
          ? current
          : {
              user: null,
              ready: true,
              error:
                'Firebase tardó demasiado en responder. Revisá tu conexión o recargá con Ctrl+Shift+R para limpiar la caché.',
            },
      )
    }, AUTH_INIT_TIMEOUT_MS)

    const unsubscribe = onAuthStateChanged(auth, async user => {
      settled = true
      window.clearTimeout(timeout)

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

      if (isAdminRoute()) {
        setState({ user: null, ready: true, error: null })
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

    return () => {
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()
    if (!isAdminEmail(normalized)) {
      throw new Error(`Solo se permiten cuentas @${ADMIN_EMAIL_DOMAIN}.`)
    }
    const credential = await signInWithEmailAndPassword(auth, normalized, password)
    // Defensa extra: si por algún motivo el dominio no coincide, cerrar sesión.
    if (!isAdminEmail(credential.user.email)) {
      await signOut(auth)
      throw new Error(`Solo se permiten cuentas @${ADMIN_EMAIL_DOMAIN}.`)
    }
  }, [])

  const registerAdmin = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase()
    if (!isAdminEmail(normalized)) {
      throw new Error(`Solo se permiten cuentas @${ADMIN_EMAIL_DOMAIN}.`)
    }
    const credential = await createUserWithEmailAndPassword(auth, normalized, password)
    if (!isAdminEmail(credential.user.email)) {
      await signOut(auth)
      throw new Error(`Solo se permiten cuentas @${ADMIN_EMAIL_DOMAIN}.`)
    }
    await sendEmailVerification(credential.user)
  }, [])

  const resendVerification = useCallback(async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await sendEmailVerification(auth.currentUser)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
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

  const value: AuthContextValue = {
    user: state.user,
    ready: state.ready,
    error: state.error,
    isAdmin: isAdminUser(state.user),
    loginAdmin,
    registerAdmin,
    resendVerification,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
