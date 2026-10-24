
import { useEffect, useRef, useState } from 'react'

// Convert a 24-hour time into a readable 12-hour label.
function formatTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return ''

  const [hours, minutes] = value.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12

  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`
}

// Accept common typed formats such as "1pm", "1:30 PM", or "13:30".
function parseTime(value) {
  const match = value.trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/i)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2] ?? 0)
  const period = match[3]?.toLowerCase()

  if (minutes > 59) return null

  if (period) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (period === 'pm' ? 12 : 0)
  } else if (hours > 23) {
    return null
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? '00' : '30'
  const value = `${String(hours).padStart(2, '0')}:${minutes}`

  return { value, label: formatTime(value) }
})

export default function TimePicker({ value, onChange, onValidityChange, label }) {
  const [text, setText] = useState(() => formatTime(value))
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(false)
  const containerRef = useRef(null)
  const optionsRef = useRef(null)

  // Position the dropdown near the currently selected time when it opens.
  function scrollToSelectedTime(element) {
    if (!element) return

    const selectedIndex = TIME_OPTIONS.findIndex(
      (option) => option.value === value
    )

    if (selectedIndex === -1) return

    const selectedOption = element.children[selectedIndex]
    if (!selectedOption) return

    element.scrollTop =
      selectedOption.offsetTop -
      element.offsetTop -
      element.clientHeight / 2 +
      selectedOption.clientHeight / 2
  }

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
        commitTime()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, text])

  function commitTime() {
    const parsed = parseTime(text)

    if (!parsed) {
      setError(true)
      onValidityChange?.(false)
      return
    }

    setError(false)
    setText(formatTime(parsed))
    onValidityChange?.(true)
    onChange(parsed)
  }

  function selectTime(option) {
    setText(option.label)
    setError(false)
    onValidityChange?.(true)
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div className="calendar-time-picker" ref={containerRef}>
      <input
        type="text"
        className={`calendar-form-input calendar-time-picker-input${error ? ' calendar-time-picker-input--error' : ''}`}
        aria-label={label}
        aria-invalid={error}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        autoComplete="off"
        placeholder="1:30 PM"
        value={text}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          const nextText = event.target.value
          setText(nextText)
          setError(false)
          onValidityChange?.(parseTime(nextText) !== null)
        }}
        onBlur={() => {
          if (!isOpen) commitTime()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitTime()
            setIsOpen(false)
          } else if (event.key === 'Escape') {
            setText(formatTime(value))
            setError(false)
            onValidityChange?.(true)
            setIsOpen(false)
          }
        }}
      />

      {isOpen && (
        <div
          ref={(element) => {
            optionsRef.current = element
            if (element) scrollToSelectedTime(element)
          }}
          className="calendar-time-picker-options"
          role="listbox"
          aria-label={`${label} options`}
        >
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`calendar-time-picker-option${option.value === value ? ' calendar-time-picker-option--selected' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectTime(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {error && <span className="calendar-time-picker-error">Enter a valid time.</span>}
    </div>
  )
}
