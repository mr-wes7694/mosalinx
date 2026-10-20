import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Settings.css'

import { useAuth } from '../hooks/useAuth.js'
import {
  getUserSettings,
  updateUserSettings,
} from '../services/settingsService.js'

const CATEGORIES = ['General', 'Display', 'Accessibility', 'About']

const DEFAULT_SETTINGS = {
  notifyText: false,
  notifyEmail: true,
  notifyPush: false,
  sidebarPosition: 'left',
  theme: 'light',
  fontSize: 'Medium',
  navSize: 'Small',
  altFont: 'Default',
  highlightedText: false,
  highlightColor: 'Yellow',
  highlightTextColor: 'Black',
  moduleZoom: false,
  zoomShortcut: 'Ctrl + Click',
  askToPostAfterSave: true,
}

// askToPostAfterSave is stored in this browser's localStorage (the Workspace
// page reads the same key), not in the backend settings, so it's merged in
// after loading and split back out before saving.
const SKIP_SAVE_PROMPT_KEY = 'mosalinx.skipSavePrompt'

function withLocalPrefs(settings) {
  let skip = false
  try {
    skip = localStorage.getItem(SKIP_SAVE_PROMPT_KEY) === '1'
  } catch {
    // storage unavailable: fall back to asking
  }
  return { ...settings, askToPostAfterSave: !skip }
}

function saveLocalPrefs(askToPostAfterSave) {
  try {
    if (askToPostAfterSave) localStorage.removeItem(SKIP_SAVE_PROMPT_KEY)
    else localStorage.setItem(SKIP_SAVE_PROMPT_KEY, '1')
  } catch {
    // storage unavailable: the choice just lasts until reload
  }
}

const THEMES = [
  { id: 'light', label: 'Light', colors: ['#ffffff', '#f2f2f2'] },
  { id: 'dark', label: 'Dark', colors: ['#232529', '#14bbc4'] },
  { id: 'teal', label: 'Teal', colors: ['#14bbc4', '#ffffff'] },
  { id: 'night', label: 'Night', colors: ['#2b2f3a', '#ffffff'] },
]

const FONT_SIZES = ['Small', 'Medium', 'Large']
const NAV_SIZES = ['Small', 'Medium', 'Large']
const ALT_FONTS = ['Default', 'Times New Roman', 'Comic Sans', 'Eras Bold']
const COLORS = ['Black', 'White', 'Yellow', 'Red', 'Blue', 'Green']

function GeneralSettings({ values, onChange }) {
  return (
    <div className="settings-section-group">
      <section className="settings-section">
        <h2 className="settings-section-title">Notification Settings</h2>
        <p className="settings-section-subtitle">Notify by:</p>

        <label className="settings-checkbox-row">
          <input
            type="checkbox"
            checked={values.notifyText}
            onChange={(e) => onChange('notifyText', e.target.checked)}
          />
          Text
        </label>

        <label className="settings-checkbox-row">
          <input
            type="checkbox"
            checked={values.notifyEmail}
            onChange={(e) => onChange('notifyEmail', e.target.checked)}
          />
          Email
        </label>

        <label className="settings-checkbox-row">
          <input
            type="checkbox"
            checked={values.notifyPush}
            onChange={(e) => onChange('notifyPush', e.target.checked)}
          />
          Browser Push Notification
        </label>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Workspace</h2>

        <label className="settings-checkbox-row">
          <input
            type="checkbox"
            checked={values.askToPostAfterSave}
            onChange={(e) => onChange('askToPostAfterSave', e.target.checked)}
          />
          Ask if I want to make a post after saving a file
        </label>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Sidebar Position</h2>

        <select
          className="settings-select"
          value={values.sidebarPosition}
          onChange={(e) => onChange('sidebarPosition', e.target.value)}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </section>
    </div>
  )
}

function DisplaySettings({ values, onChange }) {
  return (
    <div className="settings-section-group">
      <section className="settings-section">
        <h2 className="settings-section-title">Theme</h2>

        <div className="settings-theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={'settings-theme-card' + (values.theme === t.id ? ' is-active' : '')}
              onClick={() => onChange('theme', t.id)}
            >
              <span
                className="settings-theme-swatch"
                style={{ background: `linear-gradient(135deg, ${t.colors[0]} 50%, ${t.colors[1]} 50%)` }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Font Size</h2>
        <div className="settings-pill-row">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              className={'settings-pill' + (values.fontSize === size ? ' is-active' : '')}
              onClick={() => onChange('fontSize', size)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Navigation Size</h2>
        <div className="settings-pill-row">
          {NAV_SIZES.map((size) => (
            <button
              key={size}
              className={'settings-pill' + (values.navSize === size ? ' is-active' : '')}
              onClick={() => onChange('navSize', size)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function AccessibilitySettings({ values, onChange }) {
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (!isRecording) return

    function formatModifiers(e) {
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl')
      if (e.metaKey) parts.push('Cmd')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push('Alt')
      return parts
    }

    function handleKeyDown(e) {
      e.preventDefault()
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      const parts = formatModifiers(e)
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      onChange('zoomShortcut', parts.join(' + '))
      setIsRecording(false)
    }

    function handleMouseDown(e) {
      const parts = formatModifiers(e)
      if (parts.length === 0) return
      parts.push('Click')
      onChange('zoomShortcut', parts.join(' + '))
      setIsRecording(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('mousedown', handleMouseDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [isRecording, onChange])

  return (
    <div className="settings-section-group">
      <section className="settings-section">
        <h2 className="settings-section-title">Alternate Font</h2>
        <div className="settings-pill-row">
          {ALT_FONTS.map((font) => (
            <button
              key={font}
              className={'settings-pill' + (values.altFont === font ? ' is-active' : '')}
              onClick={() => onChange('altFont', font)}
            >
              {font}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Highlighted Text</h2>
        <div className="settings-toggle-row">
          <button
            className="settings-toggle"
            role="switch"
            aria-checked={values.highlightedText}
            onClick={() => onChange('highlightedText', !values.highlightedText)}
          >
            <span className="settings-toggle-knob" />
          </button>
          <span className="settings-toggle-label">{values.highlightedText ? 'On' : 'Off'}</span>
        </div>

        <div className={'settings-color-row' + (!values.highlightedText ? ' is-disabled' : '')}>
          <div className="settings-color-field">
            <label className="settings-section-subtitle" htmlFor="highlight-color">
              Highlight color
            </label>
            <select
              id="highlight-color"
              className="settings-select"
              value={values.highlightColor}
              onChange={(e) => onChange('highlightColor', e.target.value)}
              disabled={!values.highlightedText}
            >
              {COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div className="settings-color-field">
            <label className="settings-section-subtitle" htmlFor="highlight-text-color">
              Text color
            </label>
            <select
              id="highlight-text-color"
              className="settings-select"
              value={values.highlightTextColor}
              onChange={(e) => onChange('highlightTextColor', e.target.value)}
              disabled={!values.highlightedText}
            >
              {COLORS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Module Zoom</h2>
        <div className="settings-toggle-row">
          <button
            className="settings-toggle"
            role="switch"
            aria-checked={values.moduleZoom}
            onClick={() => onChange('moduleZoom', !values.moduleZoom)}
          >
            <span className="settings-toggle-knob" />
          </button>
          <span className="settings-toggle-label">{values.moduleZoom ? 'On' : 'Off'}</span>
        </div>

        <div className={'settings-shortcut-row' + (!values.moduleZoom ? ' is-disabled' : '')}>
          <span className="settings-section-subtitle">Shortcut</span>
          <div className="settings-shortcut-control">
            <span className="settings-shortcut-display">
              {isRecording ? 'Press a key or click…' : values.zoomShortcut}
            </span>
            <button
              className="settings-pill"
              disabled={!values.moduleZoom}
              onClick={() => setIsRecording(true)}
            >
              {isRecording ? 'Recording…' : 'Change'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function AboutSettings() {
  return (
    <div className="settings-section-group">
      <section className="settings-section">
        <p className="settings-about-text">
          Mosalinx is a project developed by Lesly Martinez, Veronica Johnson and Wesley Filion.
          This project is for Full Sail University and currently not to be used for commercial
          purposes. This app shall not be sold, copied, or distributed in any unlawful way. All
          assets used are for personal purposes and will not be used for monetary gain.
        </p>
      </section>
    </div>
  )
}

function Settings() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [activeCategory, setActiveCategory] = useState('General')
  const [savedSettings, setSavedSettings] = useState(() => withLocalPrefs(DEFAULT_SETTINGS))
  const [draftSettings, setDraftSettings] = useState(() => withLocalPrefs(DEFAULT_SETTINGS))
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isDirty = JSON.stringify(draftSettings) !== JSON.stringify(savedSettings)

  // Load persisted settings for the authenticated user.
  useEffect(() => {
    if (!currentUser) return

    let isActive = true

    async function loadSettings() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const settings = withLocalPrefs(await getUserSettings(currentUser))

        if (!isActive) return

        setSavedSettings(settings)
        setDraftSettings(settings)
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isActive = false
    }
  }, [currentUser])

  function updateField(key, value) {
    setSuccessMessage('')
    setDraftSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleBackOrCancel() {
    if (isDirty) {
      setShowCancelConfirm(true)
    } else {
      navigate('/dashboard')
    }
  }

  function confirmDiscard() {
    setDraftSettings(savedSettings)
    setShowCancelConfirm(false)
  }

  function dismissConfirm() {
    setShowCancelConfirm(false)
  }

  async function handleSave() {
    if (!currentUser || !isDirty || isSaving) return

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { askToPostAfterSave, ...serverSettings } = draftSettings

      // Local preference first, so it sticks even if the server save fails.
      saveLocalPrefs(askToPostAfterSave)

      // Use the value just saved rather than re-reading storage, so the
      // checkbox shows the new state straight away.
      const updatedSettings = {
        ...(await updateUserSettings(currentUser, serverSettings)),
        askToPostAfterSave,
      }

      setSavedSettings(updatedSettings)
      setDraftSettings(updatedSettings)
      setSuccessMessage('Settings saved successfully.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <button className="settings-back" onClick={handleBackOrCancel}>
          {!isDirty && (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
          {isDirty ? 'Cancel' : 'Back'}
        </button>

        {isDirty && (
          <button
            className="settings-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="settings-status">
          Loading settings…
        </div>
      )}

      {errorMessage && (
        <div className="settings-status settings-status--error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="settings-status settings-status--success">
          {successMessage}
        </div>
      )}

      {!isLoading && (
        <div className="settings-body">
          <nav className="settings-nav">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={'settings-nav-item' + (activeCategory === category ? ' is-active' : '')}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          <div className="settings-content">
            <h1>{activeCategory}</h1>
            {activeCategory === 'General' && (
              <GeneralSettings values={draftSettings} onChange={updateField} />
            )}
            {activeCategory === 'Display' && (
              <DisplaySettings values={draftSettings} onChange={updateField} />
            )}
            {activeCategory === 'Accessibility' && (
              <AccessibilitySettings values={draftSettings} onChange={updateField} />
            )}
            {activeCategory === 'About' && <AboutSettings />}
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="settings-modal-overlay" onClick={dismissConfirm}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="settings-modal-title">Discard changes?</h2>
            <p className="settings-modal-text">
              You have unsaved changes. If you leave now, they'll be lost.
            </p>
            <div className="settings-modal-actions">
              <button className="settings-modal-stay" onClick={dismissConfirm}>
                Keep editing
              </button>
              <button className="settings-modal-discard" onClick={confirmDiscard}>
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings