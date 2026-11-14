import { useState } from 'react'
import LoginForm from './LoginForm.jsx'
import SignupForm from './SignupForm.jsx'
import './AuthPanel.css'

const TABS = [
  { id: 'login', label: 'Log in' },
  { id: 'signup', label: 'Sign up' },
]

// The Log in / Sign up card shown on the landing page. The parent owns which
// tab is open (it comes from the URL), so this only reports changes.
function AuthPanel({ mode, onModeChange, onClose }) {
  const [viaKeyboard, setViaKeyboard] = useState(false)

  // Left/Right arrows move between the two tabs, as in a standard tablist.
  function handleTabKeyDown(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setViaKeyboard(true)
    const next = mode === 'login' ? 'signup' : 'login'
    onModeChange(next)
    document.getElementById(`auth-tab-${next}`)?.focus()
  }

  return (
    <div
      className="auth-card"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="auth-tabs" role="tablist" aria-label="Account access" onKeyDown={handleTabKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`auth-tab-${tab.id}`}
            type="button"
            role="tab"
            className={`auth-tab${mode === tab.id ? ' is-active' : ''}`}
            aria-selected={mode === tab.id}
            aria-controls="auth-tabpanel"
            tabIndex={mode === tab.id ? 0 : -1}
            onClick={() => {
              setViaKeyboard(false)
              onModeChange(tab.id)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="auth-tabpanel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`}>
        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        {/* Keyed so switching tabs starts the other form with a clean slate. */}
        {mode === 'login' ? <LoginForm key="login" focusOnMount={!viaKeyboard} /> : <SignupForm key="signup" focusOnMount={!viaKeyboard} />}
      </div>

      <button type="button" className="auth-back" onClick={onClose}>
        ← Back to home
      </button>
    </div>
  )
}

export default AuthPanel
