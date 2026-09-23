import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
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

const LOCATION_CATEGORIES = ['Office', 'Online', 'Out of Office', 'Away']

const OFFICE_ROOMS = [
  'Conference Room A',
  'Conference Room B',
  'Conference Room C',
  'Auditorium',
  'Break Room',
  'Lobby',
  'My Office',
]

const ONLINE_APPS = ['Teams', 'Zoom', 'Webex', 'Slack']

const OUT_OF_OFFICE_MAX_LENGTH = 30
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

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatLocation(category, detail) {
  if (!category) return ''
  if (!detail) return category
  return `${category} · ${detail}`
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
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [selectedDay, setSelectedDay] = useState(null)
  const [localItems, setLocalItems] = useState({}) // { 'YYYY-M-D': [items] }
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
  const [locationCategory, setLocationCategory] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [eventDescription, setEventDescription] = useState('')

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
    setViewDate(new Date(pickerYear, pickerMonth, 1))
    setPickerOpen(false)
  }

  function jumpToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setPickerOpen(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setStatus('loading')
      try {
        const token = await currentUser?.getIdToken?.()
        const response = await fetch(
          `/api/calendar/events?year=${year}&month=${month + 1}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : [])
          setStatus('success')
        }
      } catch (err) {
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
  }, [year, month, currentUser])

  function goToPreviousMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function dayKey(day) {
    return `${year}-${month}-${day}`
  }

  // Range-aware: an item shows up on every day between its start and end, not just its start day.
  function eventsForDay(day) {
    const dayDate = new Date(year, month, day)
    return events.filter((e) => isSameDate(new Date(e.date), dayDate))
  }

  function localItemsForDay(day) {
    const dayStart = new Date(year, month, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999)
    return Object.values(localItems)
      .flat()
      .filter((item) => item.start <= dayEnd && item.end >= dayStart)
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
    setLocationCategory('')
    setLocationDetail('')
    setEventDescription('')
  }

  function loadFormFromItem(item) {
    setEventTitle(item.title)
    setEventType(item.type)
    setStartDate(toDateInputValue(item.start))
    setStartTime(toTimeInputValue(item.start))
    setEndDate(toDateInputValue(item.end))
    setEndTime(toTimeInputValue(item.end))
    setLocationCategory(item.locationCategory || '')
    setLocationDetail(item.locationDetail || '')
    setEventDescription(item.description || '')
  }

  function openAddForm() {
    resetForm(selectedDay)
    setPanelMode('add')
  }

  function cancelAddForm() {
    setPanelMode('list')
  }

  function selectLocationCategory(category) {
    setLocationCategory(category)
    setLocationDetail('')
  }

  function handleSaveEvent() {
    if (!eventTitle.trim() || !startDate || !endDate) return

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)
    const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`

    const newItem = {
      id: Date.now(),
      dayKey: key,
      title: eventTitle.trim(),
      type: eventType,
      start,
      end,
      locationCategory,
      locationDetail,
      location: formatLocation(locationCategory, locationDetail),
      description: eventDescription.trim(),
    }

    setLocalItems((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newItem],
    }))

    setPanelMode('list')
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
    setPanelMode('view')
  }

  function handleUpdateEvent() {
    if (!activeItem || !eventTitle.trim() || !startDate || !endDate) return

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)
    const newKey = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
    const oldKey = activeItem.dayKey

    const updatedItem = {
      ...activeItem,
      dayKey: newKey,
      title: eventTitle.trim(),
      type: eventType,
      start,
      end,
      locationCategory,
      locationDetail,
      location: formatLocation(locationCategory, locationDetail),
      description: eventDescription.trim(),
    }

    setLocalItems((prev) => {
      const withoutOld = {
        ...prev,
        [oldKey]: (prev[oldKey] ?? []).filter((i) => i.id !== activeItem.id),
      }
      return {
        ...withoutOld,
        [newKey]: [...(withoutOld[newKey] ?? []), updatedItem],
      }
    })

    setActiveItem(updatedItem)
    setPanelMode('view')
  }

  function requestCancelEvent() {
    setShowCancelEventConfirm(true)
  }

  function dismissCancelEventConfirm() {
    setShowCancelEventConfirm(false)
  }

  function confirmCancelEvent() {
    if (!activeItem) return
    setLocalItems((prev) => ({
      ...prev,
      [activeItem.dayKey]: (prev[activeItem.dayKey] ?? []).filter((i) => i.id !== activeItem.id),
    }))
    setShowCancelEventConfirm(false)
    setPanelMode('list')
    setActiveItem(null)
  }

  const cells = getMonthGrid(year, month)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  // Unified list of everything that can appear as a spanning bar on the grid:
  // local (editable) items plus whatever the backend returned for this month.
  const allLocalItems = Object.values(localItems)
    .flat()
    .map((item) => ({ ...item, source: 'local' }))

  const allBackendItems = events.map((e, idx) => ({
    id: `backend-${idx}`,
    title: e.title,
    start: new Date(e.date),
    end: new Date(e.date),
    source: 'backend',
  }))

  const allDisplayItems = [...allBackendItems, ...allLocalItems]

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

  const combinedSelectedItems = selectedDay
    ? [...eventsForDay(selectedDay), ...localItemsForDay(selectedDay)]
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
          onChange={(e) => setEventTitle(e.target.value)}
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
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="time"
            className="calendar-form-input calendar-form-input--time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
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
            onChange={(e) => setEndDate(e.target.value)}
          />
          <input
            type="time"
            className="calendar-form-input calendar-form-input--time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="calendar-form-field">
        <label className="calendar-form-label">Location</label>
        <div className="calendar-location-pills">
          {LOCATION_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={
                'calendar-location-pill' +
                (locationCategory === category ? ' is-active' : '')
              }
              onClick={() => selectLocationCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {locationCategory === 'Office' && (
          <select
            className="calendar-form-select calendar-location-detail"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
          >
            <option value="">Select a room…</option>
            {OFFICE_ROOMS.map((room) => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        )}

        {locationCategory === 'Online' && (
          <select
            className="calendar-form-select calendar-location-detail"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
          >
            <option value="">Select an app…</option>
            {ONLINE_APPS.map((app) => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        )}

        {locationCategory === 'Out of Office' && (
          <div className="calendar-location-detail">
            <input
              type="text"
              className="calendar-form-input"
              placeholder="Where are you?"
              maxLength={OUT_OF_OFFICE_MAX_LENGTH}
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
            />
            <span className="calendar-char-count">
              {locationDetail.length}/{OUT_OF_OFFICE_MAX_LENGTH}
            </span>
          </div>
        )}
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
                        const isLocal = item.source === 'local'
                        const typeClass = isLocal ? (TYPE_CLASS_MAP[item.type] ?? 'other') : 'backend'
                        const style = {
                          gridColumn: `${startCol + 1} / ${endCol + 2}`,
                          gridRow: lane + 1,
                        }

                        if (!isLocal) {
                          return (
                            <span
                              key={item.id}
                              className="calendar-event-bar calendar-event-bar--backend"
                              style={style}
                            >
                              {item.title}
                            </span>
                          )
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
                    combinedSelectedItems.map((item, idx) => {
                      if (!item.type) {
                        return (
                          <div key={idx} className="calendar-sidepanel-item">
                            {item.title}
                          </div>
                        )
                      }
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
                          {item.location && (
                            <div className="calendar-sidepanel-item-location">{item.location}</div>
                          )}
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
                <div className="calendar-form-actions">
                  <button className="calendar-form-cancel" onClick={cancelAddForm}>Cancel</button>
                  <button className="calendar-form-save" onClick={handleSaveEvent}>Save</button>
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

                {activeItem.location && (
                  <div className="calendar-detail-field">
                    <span className="calendar-detail-label">Location</span>
                    <span className="calendar-detail-value">{activeItem.location}</span>
                  </div>
                )}

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
        )}
      </div>

      {showCancelEventConfirm && (
        <div className="calendar-modal-overlay" onClick={dismissCancelEventConfirm}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="calendar-modal-title">Cancel this event?</h2>
            <p className="calendar-modal-text">
              This will permanently remove "{activeItem?.title}" from the calendar.
            </p>
            <div className="calendar-modal-actions">
              <button className="calendar-modal-stay" onClick={dismissCancelEventConfirm}>
                Keep event
              </button>
              <button className="calendar-modal-discard" onClick={confirmCancelEvent}>
                Cancel event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar