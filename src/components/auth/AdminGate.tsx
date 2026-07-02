import { useState, type ReactNode } from 'react'
import { Eye, EyeOff, LogIn, MailCheck, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react'
import { ADMIN_EMAIL_DOMAIN, isAdminEmail, useAuth } from '../../providers/AuthProvider'

const MIN_PASSWORD_LENGTH = 6

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAdmin) {
    return <>{children}</>
  }

  const logueadoNoAdmin = !!user && !user.isAnonymous
  const dominioValido = isAdminEmail(user?.email)
  const necesitaVerificar = logueadoNoAdmin && dominioValido && !user?.emailVerified

  const esRegistro = mode === 'register'
  const passwordsCoinciden = password === confirmPassword
  const passwordSuficiente = password.length >= MIN_PASSWORD_LENGTH
  const registroValido = passwordSuficiente && passwordsCoinciden
  const submitDeshabilitado =
    busy || !email.trim() || !password.trim() || (esRegistro && !registroValido)

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'))
    setError(null)
    setInfo(null)
    setConfirmPassword('')
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (esRegistro) {
      if (!passwordSuficiente) {
        setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        return
      }
      if (!passwordsCoinciden) {
        setError('Las contraseñas no coinciden.')
        return
      }
    }
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
      setInfo('Te enviamos un email de verificación. Revisá tu bandeja (y la carpeta de correo no deseado) y luego recargá la página.')
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
            verificado. Abrí el enlace que te enviamos para acceder al panel.
          </p>
          <p className="admin-gate-spam-hint">
            Si no lo ves en la bandeja de entrada, revisá <strong>Correo no deseado</strong> o{' '}
            <strong>Spam</strong>.
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
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              placeholder={esRegistro ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
              minLength={esRegistro ? MIN_PASSWORD_LENGTH : undefined}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(s => !s)}
              disabled={busy}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {esRegistro && (
          <div className="form-group">
            <label className="form-label">Repetir contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={busy}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            {confirmPassword.length > 0 && !passwordsCoinciden && (
              <p className="admin-gate-hint admin-gate-hint--warn">Las contraseñas no coinciden.</p>
            )}
            {confirmPassword.length > 0 && passwordsCoinciden && passwordSuficiente && (
              <p className="admin-gate-hint admin-gate-hint--ok">Las contraseñas coinciden.</p>
            )}
          </div>
        )}

        {error && <p className="admin-gate-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitDeshabilitado}
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
