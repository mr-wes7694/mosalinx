import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useProject } from '../context/useProject'
import { API_BASE_URL } from '../config/api'
import './Calendar.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_COLORS = [
  '#BFD9EC', // Jan
  '#F0C8D8', // Feb
  '#C9E4C5', // Mar
  '#F5E3A1', // Apr
  '#D7C6ED', // May
  '#BFE3D0', // Jun
  '#F7D48A', // Jul
  '#F3B79E', // Aug
  '#E9C48F', // Sep
  '#EDA36E', // Oct
  '#D2B48C', // Nov
  '#C7D9E8', // Dec
]

const EVENT_TYPES = ['Meeting', 'Appointment', 'PTO', 'Absence (Non-PTO)', 'Travel', 'Other']

const TYPE_CLASS_MAP = {
  'Meeting': 'meeting',
  'Appointment': 'appointment',
  'PTO': 'pto',
  'Absence (Non-PTO)': 'absence',
  'Travel': 'travel',
  'Other': 'other',
}

const DESCRIPTION_PREVIEW_LENGTH = 60
const MAX_VISIBLE_LANES = 3

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeInputValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Parse API datetime values while preserving timezone information for correct local display.
function parseCalendarDatetime(value) {
  if (!value) return null

  const normalized = String(value).replace(' ', 'T')
  return new Date(normalized)
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function getDescriptionPreview(description) {
  if (!description) return ''
  if (description.length <= DESCRIPTION_PREVIEW_LENGTH) return description
  return description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd() + '…'
}

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function diffDays(a, b) {
  return Math.round((b - a) / 86400000)
}

function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7
  const trailingCount = totalCells - (startDay + daysInMonth)

  const cells = []

  for (let i = 0; i < startDay; i++) {
    const day = prevMonthDays - startDay + 1 + i
    cells.push({ day, inMonth: false, date: new Date(year, month - 1, day) })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true, date: new Date(year, month, day) })
  }
  for (let day = 1; day <= trailingCount; day++) {
    cells.push({ day, inMonth: false, date: new Date(year, month + 1, day) })
  }

  return cells
}

function Calendar() {
  const { currentUser } = useAuth()
  const { activeProject, loadingProjects } = useProject()
  const projectId = activeProject?.project_id
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [selectedDay, setSelectedDay] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(today.getMonth())
  const [pickerYear, setPickerYear] = useState(today.getFullYear())

  // 'list' | 'add' | 'view' | 'manage'
  const [panelMode, setPanelMode] = useState('list')
  const [activeItem, setActiveItem] = useState(null)
  const [showCancelEventConfirm, setShowCancelEventConfirm] = useState(false)

  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('Meeting')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [eventDescription, setEventDescription] = useState('')
  const [formError, setFormError] = useState('')

  // Track event submissions to prevent duplicate requests.
  const [isSavingEvent, setIsSavingEvent] = useState(false)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function openPicker() {
    setPickerMonth(month)
    setPickerYear(year)
    setPickerOpen(true)
  }

  function closePicker() {
    setPickerOpen(false)
  }

  function applyPicker() {
    changeMonth(new Date(pickerYear, pickerMonth, 1))
    setPickerOpen(false)
  }

  function jumpToToday() {
    changeMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setPickerOpen(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      // Wait for project data and avoid requesting events without an active project.
      if (loadingProjects) {
        setStatus('loading')
        return
      }

      if (!projectId || !currentUser) {
        setEvents([])
        setStatus('success')
        return
      }

      setStatus('loading')
      try {
        const token = await currentUser?.getIdToken?.()
        const response = await fetch(
          `${API_BASE_URL}/api/calendar-events/project/${projectId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        if (!cancelled) {
          setEvents(Array.isArray(data.events) ? data.events : [])
          setStatus('success')
        }
      } catch {
        if (!cancelled) {
          setEvents([])
          setStatus('error')
        }
      }
    }

    loadEvents()
    return () => {
      cancelled = true
    }
  }, [projectId, loadingProjects, currentUser])

  // Changes the month being viewed and clears any selected day, since a day
  // selected in one month has no guaranteed equivalent in another (e.g. the
  // 31st doesn't exist in February) and JS date math would otherwise silently
  // roll it into a later month instead of leaving the view on the intended one.
  function changeMonth(newDate) {
    setViewDate(newDate)
    setSelectedDay(null)
    setPanelMode('list')
    setActiveItem(null)
    setShowCancelEventConfirm(false)
  }

  function goToPreviousMonth() {
    changeMonth(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    changeMonth(new Date(year, month + 1, 1))
  }

  function handleDayClick(day, inMonth) {
    if (!inMonth) return
    setSelectedDay(day)
    setPanelMode('list')
    setActiveItem(null)
    resetForm(day)
  }

  function closeSidebar() {
    setSelectedDay(null)
    setPanelMode('list')
    setActiveItem(null)
    setShowCancelEventConfirm(false)
  }

  function resetForm(day) {
    const base = new Date(year, month, day)
    setEventTitle('')
    setEventType('Meeting')
    setStartDate(toDateInputValue(base))
    setStartTime('09:00')
    setEndDate(toDateInputValue(base))
    setEndTime('10:00')
    setEventDescription('')
    setFormError('')
  }

  function loadFormFromItem(item) {
    setEventTitle(item.title)
    setEventType(item.type)
    setStartDate(toDateInputValue(item.start))
    setStartTime(toTimeInputValue(item.start))
    setEndDate(toDateInputValue(item.end))
    setEndTime(toTimeInputValue(item.end))
    setEventDescription(item.description || '')
    setFormError('')
  }

  function openAddForm() {
    resetForm(selectedDay)
    setPanelMode('add')
  }

  function cancelAddForm() {
    setFormError('')
    setPanelMode('list')
  }

  // Shared by both the add and manage forms. Returns an error message to show
  // the person, or '' when the form is good to save.
  function validateEventForm() {
    if (!eventTitle.trim()) {
      return 'Please enter a title for the event.'
    }
    if (!startDate || !endDate) {
      return 'Please choose a start and end date.'
    }
    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)
    if (end <= start) {
      return 'End time must be after the start time.'
    }
    return ''
  }

  // Validate the form before submitting a new event to the project calendar.
  async function handleSaveEvent() {
    if (isSavingEvent) return

    const error = validateEventForm()

    if (error) {
      setFormError(error)
      return
    }
    setFormError('')

    // Preserve the entered local date and time for MySQL DATETIME fields.
    const eventPayload = {
      projectId,
      eventTitle: eventTitle.trim(),
      eventType,
      eventDescription: eventDescription.trim(),
      startDatetime: `${startDate}T${startTime}:00`,
      endDatetime: `${endDate}T${endTime}:00`,
    }

    // Save the event to MySQL before updating the calendar.
    setIsSavingEvent(true)

    try {
      const token = await currentUser.getIdToken()

      const response = await fetch(`${API_BASE_URL}/api/calendar-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create event.')
      }

      // Reload project events so the new event appears in the calendar.
      const refreshResponse = await fetch(
        `${API_BASE_URL}/api/calendar-events/project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!refreshResponse.ok) {
        throw new Error('Event saved, but the calendar could not be refreshed.')
      }

      const refreshData = await refreshResponse.json()
      setEvents(Array.isArray(refreshData.events) ? refreshData.events : [])
      setPanelMode('list')
    } catch (error) {
      setFormError(error.message || 'Unable to create event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  function openItemView(item) {
    setActiveItem(item)
    setPanelMode('view')
  }

  // Opens an item straight from a spanning grid bar, picking whichever end of
  // the event actually falls within the month currently being viewed.
  function openBarItem(item) {
    const s = dateOnly(item.start)
    const e = dateOnly(item.end)
    let day = 1
    if (s.getFullYear() === year && s.getMonth() === month) {
      day = s.getDate()
    } else if (e.getFullYear() === year && e.getMonth() === month) {
      day = e.getDate()
    }
    setSelectedDay(day)
    setActiveItem(item)
    setPanelMode('view')
  }

  function backToList() {
    setPanelMode('list')
    setActiveItem(null)
  }

  function openManageForm() {
    loadFormFromItem(activeItem)
    setPanelMode('manage')
  }

  function cancelManageForm() {
    setFormError('')
    setPanelMode('view')
  }

  // Validate changes before updating an existing calendar event.
  async function handleUpdateEvent() {
    if (!activeItem || isSavingEvent) return

    const error = validateEventForm()
    if (error) {
      setFormError(error)
      return
    }
    setFormError('')

    // Preserve local date and time values when updating the calendar event.
    const eventPayload = {
      eventTitle: eventTitle.trim(),
      eventType,
      eventDescription: eventDescription.trim(),
      startDatetime: `${startDate}T${startTime}:00`,
      endDatetime: `${endDate}T${endTime}:00`,
    }

    // Save the updated event to the project's calendar in MySQL.
    setIsSavingEvent(true)

    try {
      const token = await currentUser.getIdToken()

      const response = await fetch(
        `${API_BASE_URL}/api/calendar-events/${activeItem.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Unable to update event.')
      }

      // Reload saved events so the calendar reflects the latest database values.
      const refreshResponse = await fetch(
        `${API_BASE_URL}/api/calendar-events/project/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!refreshResponse.ok) {
        throw new Error('Event updated, but the calendar could not be refreshed.')
      }

      const refreshData = await refreshResponse.json()
      const updatedEvents = Array.isArray(refreshData.events)
        ? refreshData.events
        : []

      setEvents(updatedEvents)

      // Return to the event list after the successful update.
      setActiveItem(null)
      setPanelMode('list')

    } catch (error) {
      setFormError(error.message || 'Unable to update event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  function requestCancelEvent() {
    // Clear previous form errors before opening the deletion confirmation.
    setFormError('')
    setShowCancelEventConfirm(true)
  }

  function dismissCancelEventConfirm() {
    if (isSavingEvent) return
    setShowCancelEventConfirm(false)
  }

  async function confirmCancelEvent() {
    if (!activeItem || isSavingEvent) return

    // Delete the selected event from the project calendar in MySQL.
    setIsSavingEvent(true)
    setFormError('')

    try {
      const token = await currentUser.getIdToken()

      const response = await fetch(
        `${API_BASE_URL}/api/calendar-events/${activeItem.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Unable to delete event.')
      }

      // Update the calendar only after MySQL confirms the event was deleted.
      setEvents((prev) =>
        prev.filter((event) => event.event_id !== activeItem.id)
      )

      setShowCancelEventConfirm(false)
      setPanelMode('list')
      setActiveItem(null)

    } catch (error) {
      setFormError(error.message || 'Unable to delete event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  const cells = getMonthGrid(year, month)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  // Convert database events into the format used by the calendar grid and sidebar.
  const allBackendItems = events.map((event) => ({
    id: event.event_id,
    title: event.event_title,
    type: event.event_type || 'Other',
    start: parseCalendarDatetime(event.start_datetime),
    end: parseCalendarDatetime(event.end_datetime || event.start_datetime),
    description: event.event_description || '',
    source: 'backend',
  }))

  const allDisplayItems = allBackendItems

  // Lays out one week's worth of spanning bars: clips each item to the week's
  // visible date range, assigns it a stacking lane, and tracks per-day overflow
  // once a day already has MAX_VISIBLE_LANES bars showing.
  function computeWeekLayout(week) {
    const weekStart = week[0].date
    const weekEnd = week[6].date

    const overlapping = allDisplayItems
      .map((item) => {
        const s = dateOnly(item.start)
        const e = dateOnly(item.end)
        if (e < weekStart || s > weekEnd) return null
        const segStart = s < weekStart ? weekStart : s
        const segEnd = e > weekEnd ? weekEnd : e
        return {
          item,
          startCol: diffDays(weekStart, segStart),
          endCol: diffDays(weekStart, segEnd),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol))

    const laneEnds = []
    const bars = []
    const overflowByCol = [0, 0, 0, 0, 0, 0, 0]

    overlapping.forEach((seg) => {
      let lane = laneEnds.findIndex((end) => end < seg.startCol)
      if (lane === -1) lane = laneEnds.length

      if (lane < MAX_VISIBLE_LANES) {
        laneEnds[lane] = seg.endCol
        bars.push({ ...seg, lane })
      } else {
        for (let c = seg.startCol; c <= seg.endCol; c++) {
          overflowByCol[c] += 1
        }
      }
    })

    return { bars, overflowByCol }
  }

  const selectedDate = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  // Show events that overlap the selected day, including multi-day events.
  const combinedSelectedItems = selectedDay
    ? allDisplayItems.filter((item) => {
        const dayStart = new Date(year, month, selectedDay, 0, 0, 0, 0)
        const dayEnd = new Date(year, month, selectedDay, 23, 59, 59, 999)
        return item.start <= dayEnd && item.end >= dayStart
      })
    : []

  const eventFormFields = (
    <>
      <div className="calendar-form-field">
        <label className="calendar-form-label">Title</label>
        <input
          type="text"
          className="calendar-form-input"
          placeholder="e.g. Client kickoff call"
          value={eventTitle}
          onChange={(e) => {
            setFormError('')
            setEventTitle(e.target.value)
          }}
        />
      </div>

      <div className="calendar-form-field">
        <label className="calendar-form-label">Event type</label>
        <select
          className="calendar-form-select"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="calendar-form-field">
        <label className="calendar-form-label">Start</label>
        <div className="calendar-form-datetime">
          <input
            type="date"
            className="calendar-form-input"
            value={startDate}
            onChange={(e) => {
              setFormError('')
              setStartDate(e.target.value)
            }}
          />
          <input
            type="time"
            className="calendar-form-input calendar-form-input--time"
            value={startTime}
            onChange={(e) => {
              setFormError('')
              setStartTime(e.target.value)
            }}
          />
        </div>
      </div>

      <div className="calendar-form-field">
        <label className="calendar-form-label">End</label>
        <div className="calendar-form-datetime">
          <input
            type="date"
            className="calendar-form-input"
            value={endDate}
            onChange={(e) => {
              setFormError('')
              setEndDate(e.target.value)
            }}
          />
          <input
            type="time"
            className="calendar-form-input calendar-form-input--time"
            value={endTime}
            onChange={(e) => {
              setFormError('')
              setEndTime(e.target.value)
            }}
          />
        </div>
      </div>

      <div className="calendar-form-field">
        <label className="calendar-form-label">Description</label>
        <textarea
          className="calendar-form-textarea"
          rows={3}
          placeholder="Add any notes or details…"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
        />
      </div>
    </>
  )

  return (
    <div className="calendar-page">
      <div className={'calendar-layout' + (selectedDay ? ' calendar-layout--panel-open' : '')}>
        <div className="calendar-main">
          <div className="calendar-header" style={{ background: MONTH_COLORS[month] }}>
            <div className="calendar-title-wrap">
              <button className="calendar-title" onClick={openPicker}>
                {monthLabel}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="calendar-title-caret">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {pickerOpen && (
                <div className="calendar-picker">
                  <div className="calendar-picker-row">
                    <select
                      className="calendar-picker-select"
                      value={pickerMonth}
                      onChange={(e) => setPickerMonth(Number(e.target.value))}
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>

                    <select
                      className="calendar-picker-select"
                      value={pickerYear}
                      onChange={(e) => setPickerYear(Number(e.target.value))}
                    >
                      {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="calendar-picker-actions">
                    <button className="calendar-picker-today" onClick={jumpToToday}>Today</button>
                    <div className="calendar-picker-actions-right">
                      <button className="calendar-picker-cancel" onClick={closePicker}>Cancel</button>
                      <button className="calendar-picker-go" onClick={applyPicker}>Go</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="calendar-nav">
              <button className="calendar-today-btn" onClick={jumpToToday}>
                Today
              </button>
              <button className="calendar-nav-btn" onClick={goToPreviousMonth} aria-label="Previous month">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button className="calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="calendar-banner calendar-banner--error">
              Couldn't load events right now. Showing an empty calendar.
            </div>
          )}

          <div className="calendar-grid">
            <div className="calendar-weekdays-row">
              {WEEKDAYS.map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-weeks">
              {weeks.map((week, weekIdx) => {
                const { bars, overflowByCol } = computeWeekLayout(week)
                return (
                  <div className="calendar-week" key={weekIdx}>
                    {week.map((cell, i) => (
                      <button
                        key={i}
                        type="button"
                        className={
                          'calendar-cell' +
                          (cell.inMonth ? '' : ' calendar-cell--outside') +
                          (isSameDate(cell.date, today) ? ' calendar-cell--today' : '') +
                          (selectedDay === cell.day && cell.inMonth ? ' calendar-cell--selected' : '')
                        }
                        onClick={() => handleDayClick(cell.day, cell.inMonth)}
                        disabled={!cell.inMonth}
                      >
                        <span className="calendar-cell-number">{cell.day}</span>
                      </button>
                    ))}

                    <div className="calendar-week-events">
                      {bars.map(({ item, startCol, endCol, lane }) => {
                        // Apply the appropriate color styling based on the saved event type.
                        const typeClass = TYPE_CLASS_MAP[item.type] ?? 'other'
                        const style = {
                          gridColumn: `${startCol + 1} / ${endCol + 2}`,
                          gridRow: lane + 1,
                        }

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`calendar-event-bar calendar-event-bar--${typeClass}`}
                            style={style}
                            onClick={(e) => {
                              e.stopPropagation()
                              openBarItem(item)
                            }}
                          >
                            {item.title}
                          </button>
                        )
                      })}

                      {overflowByCol.map((count, colIdx) =>
                        count > 0 ? (
                          <span
                            key={`more-${colIdx}`}
                            className="calendar-event-bar calendar-event-bar--more"
                            style={{
                              gridColumn: `${colIdx + 1} / ${colIdx + 2}`,
                              gridRow: MAX_VISIBLE_LANES + 1,
                            }}
                          >
                            +{count} more
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {selectedDay && (
          <>
            {/* Only visible/interactive below the responsive breakpoint (see
                Calendar.css), where the panel becomes a fixed drawer over the
                calendar instead of a flex sibling squeezing it narrow. */}
            <div className="calendar-sidepanel-backdrop" onClick={closeSidebar} />
            <aside className="calendar-sidepanel">
            <div className="calendar-sidepanel-header">
              <h2 className="calendar-sidepanel-date">{selectedDate}</h2>
              <button className="calendar-sidepanel-exit" onClick={closeSidebar} aria-label="Close">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {panelMode === 'list' && (
              <>
                <button className="calendar-sidepanel-add-trigger" onClick={openAddForm}>
                  + Add event
                </button>

                <div className="calendar-sidepanel-list">
                  {combinedSelectedItems.length === 0 ? (
                    <p className="calendar-sidepanel-empty">No items for this day yet.</p>
                  ) : (
                    combinedSelectedItems.map((item) => {
                      // All events use the same interactive details and management controls.
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="calendar-sidepanel-item calendar-sidepanel-item--clickable"
                          onClick={() => openItemView(item)}
                        >
                          <div className="calendar-sidepanel-item-title">{item.title}</div>
                          <div className="calendar-sidepanel-item-top">
                            <span className={`calendar-type-badge calendar-type-badge--${TYPE_CLASS_MAP[item.type] ?? 'other'}`}>
                              {item.type}
                            </span>
                            <span className="calendar-sidepanel-item-time">
                              {formatTime(item.start)} – {formatTime(item.end)}
                            </span>
                          </div>

                          {item.description && (
                            <div className="calendar-sidepanel-item-description">
                              {getDescriptionPreview(item.description)}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {panelMode === 'add' && (
              <div className="calendar-event-form">
                {eventFormFields}
                {formError && (
                  <p className="calendar-form-error" role="alert">{formError}</p>
                )}
                <div className="calendar-form-actions">
                  <button className="calendar-form-cancel" onClick={cancelAddForm}>Cancel</button>
                  <button
                    className="calendar-form-save"
                    onClick={handleSaveEvent}
                    disabled={isSavingEvent}
                  >
                    {isSavingEvent ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {panelMode === 'view' && activeItem && (
              <div className="calendar-item-detail">
                <button className="calendar-detail-back" onClick={backToList}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back to list
                </button>

                <h3 className="calendar-detail-title">{activeItem.title}</h3>

                <div className="calendar-detail-row">
                  <span className={`calendar-type-badge calendar-type-badge--${TYPE_CLASS_MAP[activeItem.type] ?? 'other'}`}>
                    {activeItem.type}
                  </span>
                  <span className="calendar-detail-time">
                    {formatTime(activeItem.start)} – {formatTime(activeItem.end)}
                  </span>
                </div>

                {activeItem.description && (
                  <div className="calendar-detail-field">
                    <span className="calendar-detail-label">Description</span>
                    <span className="calendar-detail-value calendar-detail-value--multiline">
                      {activeItem.description}
                    </span>
                  </div>
                )}

                <button className="calendar-manage-btn" onClick={openManageForm}>
                  Manage
                </button>
              </div>
            )}

            {panelMode === 'manage' && (
              <div className="calendar-event-form">
                {eventFormFields}
                {formError && (
                  <p className="calendar-form-error" role="alert">{formError}</p>
                )}
                <div className="calendar-form-actions">
                  <button className="calendar-form-cancel" onClick={cancelManageForm}>Cancel</button>
                  <button className="calendar-form-save" onClick={handleUpdateEvent}>Save</button>
                </div>

                <button className="calendar-cancel-event-btn" onClick={requestCancelEvent}>
                  Cancel event
                </button>
              </div>
            )}
            </aside>
          </>
        )}
      </div>

      {showCancelEventConfirm && (
        <div className="calendar-modal-overlay" onClick={dismissCancelEventConfirm}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="calendar-modal-title">Cancel this event?</h2>
            <p className="calendar-modal-text">
              This will permanently remove "{activeItem?.title}" from the calendar.
            </p>

            {formError && (
              <p className="calendar-form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="calendar-modal-actions">
              <button className="calendar-modal-stay" onClick={dismissCancelEventConfirm}>
                Keep event
              </button>
              <button
                className="calendar-modal-discard"
                onClick={confirmCancelEvent}
                disabled={isSavingEvent}
              >
                {isSavingEvent ? 'Deleting...' : 'Cancel event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar