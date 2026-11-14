import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth.js'

// Existing Firebase signup behavior, moved from the old Signup page.
function SignupForm({ focusOnMount = true }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { beginRegistration, endRegistration } = useAuth()
  const emailRef = useRef(null)

  // Start in the first field so the form is ready to type into. Skipped
  // when the user switched tabs with the arrow keys, so focus stays on the tab.
  useEffect(() => {
    if (focusOnMount) emailRef.current?.focus()
  }, [focusOnMount])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    beginRegistration()

    try {
      await registerUser(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code) {
        setError(mapFirebaseError(err.code))
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      endRegistration()
      setIsSubmitting(false)
    }
  }

  const describedBy = error ? 'auth-error' : undefined

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-label" htmlFor="auth-email">Email</label>
      <input
        ref={emailRef}
        id="auth-email"
        type="email"
        className="auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
      />

      <label className="auth-label" htmlFor="auth-password">Password</label>
      <input
        id="auth-password"
        type="password"
        className="auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        minLength={6}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
      />

      <label className="auth-label" htmlFor="auth-confirm-password">Confirm password</label>
      <input
        id="auth-confirm-password"
        type="password"
        className="auth-input"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        minLength={6}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
      />

      {/* role="alert" so screen readers announce failures as they appear. */}
      {error && <p id="auth-error" className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Sign up'}
      </button>
    </form>
  )
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default SignupForm
