import { useState, type ReactNode } from 'react'
import { LogIn, MailCheck, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react'
import { ADMIN_EMAIL_DOMAIN, isAdminEmail, useAuth } from '../../providers/AuthProvider'

type Mode = 'login' | 'register'

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos.'
    case 'auth/invalid-email':
      return 'El email no tiene un formato válido.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese email. Probá iniciar sesión.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
    case 'auth/network-request-failed':
      return 'Sin conexión con Firebase. Revisá tu internet.'
    default:
      return (err as Error)?.message ?? 'No se pudo completar la operación.'
  }
}

export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loginAdmin, registerAdmin, resendVerification, logout } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAdmin) {
    return <>{children}</>
  }

  const logueadoNoAdmin = !!user && !user.isAnonymous
  const dominioValido = isAdminEmail(user?.email)
  const necesitaVerificar = logueadoNoAdmin && dominioValido && !user?.emailVerified

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'))
    setError(null)
    setInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'login') {
        await loginAdmin(email, password)
      } else {
        await registerAdmin(email, password)
      }
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await resendVerification()
      setInfo('Te enviamos un email de verificación. Revisá tu bandeja y luego recargá la página.')
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  if (necesitaVerificar) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <div className="admin-gate-icon">
            <MailCheck size={28} />
          </div>
          <h1>Verificá tu email</h1>
          <p>
            Iniciaste sesión como <strong>{user?.email}</strong>, pero tu correo todavía no está
            verificado. Verificalo para acceder al panel.
          </p>
          {info && <p className="admin-gate-info">{info}</p>}
          {error && <p className="admin-gate-error">{error}</p>}
          <button className="btn btn-primary" onClick={handleResend} disabled={busy}>
            <RefreshCw size={16} /> {busy ? 'Enviando…' : 'Reenviar verificación'}
          </button>
          <button className="admin-gate-link" onClick={() => logout()} disabled={busy}>
            Usar otra cuenta
          </button>
        </div>
      </div>
    )
  }

  if (logueadoNoAdmin && !dominioValido) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <div className="admin-gate-icon admin-gate-icon--warn">
            <ShieldCheck size={28} />
          </div>
          <h1>Acceso no autorizado</h1>
          <p>
            La cuenta <strong>{user?.email}</strong> no pertenece al dominio autorizado
            (@{ADMIN_EMAIL_DOMAIN}).
          </p>
          <button className="btn btn-primary" onClick={() => logout()} disabled={busy}>
            Usar otra cuenta
          </button>
        </div>
      </div>
    )
  }

  const esRegistro = mode === 'register'

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={handleSubmit}>
        <div className="admin-gate-icon">
          <ShieldCheck size={28} />
        </div>
        <h1>{esRegistro ? 'Crear cuenta' : 'Panel de gestión'}</h1>
        <p>
          {esRegistro
            ? `Registrate con tu correo @${ADMIN_EMAIL_DOMAIN}. Te enviaremos un email de verificación.`
            : `Ingresá con tu cuenta @${ADMIN_EMAIL_DOMAIN}.`}
        </p>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            autoComplete="username"
            placeholder={`nombre@${ADMIN_EMAIL_DOMAIN}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-input"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            placeholder={esRegistro ? 'Mínimo 6 caracteres' : '••••••••'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={busy}
            minLength={esRegistro ? 6 : undefined}
            required
          />
        </div>

        {error && <p className="admin-gate-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !email.trim() || !password.trim()}
        >
          {esRegistro ? <UserPlus size={16} /> : <LogIn size={16} />}
          {busy
            ? esRegistro
              ? 'Creando…'
              : 'Ingresando…'
            : esRegistro
              ? 'Crear cuenta'
              : 'Ingresar'}
        </button>

        <button type="button" className="admin-gate-link" onClick={toggleMode} disabled={busy}>
          {esRegistro
            ? '¿Ya tenés cuenta? Iniciá sesión'
            : '¿No tenés cuenta? Registrate'}
        </button>
      </form>
    </div>
  )
}
