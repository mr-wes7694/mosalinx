import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../services/authService'

// Existing Firebase login behavior, moved from the old Login page.
function LoginForm({ focusOnMount = true }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const emailRef = useRef(null)

  // Start in the first field so the form is ready to type into. Skipped
  // when the user switched tabs with the arrow keys, so focus stays on the tab.
  useEffect(() => {
    if (focusOnMount) emailRef.current?.focus()
  }, [focusOnMount])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await loginUser(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(mapFirebaseError(err.code))
    } finally {
      setIsSubmitting(false)
    }
  }

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
        aria-describedby={error ? 'auth-error' : undefined}
      />

      <label className="auth-label" htmlFor="auth-password">Password</label>
      <input
        id="auth-password"
        type="password"
        className="auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'auth-error' : undefined}
      />

      {/* role="alert" so screen readers announce failures as they appear. */}
      {error && <p id="auth-error" className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-login auth-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a moment.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default LoginForm
