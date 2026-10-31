import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { getAnalyticsSource, getAnalyticsSources, getProjectPost, getProjectPosts } from '../../data/dashboardSources.js'
import {
  CELL,
  GAP,
  TEXT_SIZES,
  TILE_LIMITS,
  TILE_STYLES,
  colorAfterStyleChange,
  colorsForStyle,
  effectiveFontSize,
} from './tileConfig.js'
import './DashboardTile.css'

// ---------- Small helpers ----------

// A steady little tilt per tile so the board looks a little more human.
function tiltFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return ((Math.abs(hash) % 7) - 3) * 0.55
}

function formatPostTime(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Date-only strings would otherwise be read as UTC.
function parseEventDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isToday(date) {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

// ---------- Tile bodies: one per data type ----------

function TextBody({ config }) {
  if (!config.text?.trim()) return <p className="tile-empty">Nothing written yet. Use Edit to add a message.</p>
  return <p className="tile-text">{config.text}</p>
}

function GraphBody({ config }) {
  const source = getAnalyticsSource(config.sourceId)
  if (!source || source.values.length === 0) {
    return <p className="tile-empty">This graph has no data to show. Use Edit to pick a source.</p>
  }

  const max = Math.max(...source.values, 1)
  const label = `${source.label}: ${source.labels.map((l, i) => `${l} ${source.values[i]}`).join(', ')}`

  return (
    <figure className="tile-graph" aria-label={label}>
      <figcaption className="tile-graph-caption">{source.label}</figcaption>
      {config.chart === 'line' ? (
        <div className="tile-graph-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              points={source.values
                .map((v, i) => {
                  const x = source.values.length === 1 ? 50 : (i / (source.values.length - 1)) * 100
                  return `${x},${96 - (v / max) * 88}`
                })
                .join(' ')}
            />
          </svg>
          <div className="tile-graph-dots" aria-hidden="true">
            {source.values.map((v, i) => (
              <span
                key={source.labels[i]}
                className="tile-graph-dot"
                style={{
                  left: `${source.values.length === 1 ? 50 : (i / (source.values.length - 1)) * 100}%`,
                  bottom: `${4 + (v / max) * 88}%`,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="tile-graph-plot tile-graph-plot--bars" aria-hidden="true">
          {source.values.map((v, i) => (
            <div key={source.labels[i]} className="tile-graph-bar-col">
              <span className="tile-graph-value">{v}</span>
              <div className="tile-graph-bar" style={{ height: `${Math.max((v / max) * 100, 3)}%` }} />
            </div>
          ))}
        </div>
      )}
      <div className="tile-graph-axis" aria-hidden="true">
        {source.labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </figure>
  )
}

function CalendarBody() {
  const { currentUser } = useAuth()
  const [state, setState] = useState({ status: 'loading', events: [] })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const now = new Date()
        const token = await currentUser?.getIdToken?.()
        const response = await fetch(
          `/api/calendar/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        const events = (Array.isArray(data) ? data : [])
          .map((event) => ({ title: event.title, date: parseEventDate(event.date) }))
          .filter((event) => event.date && isToday(event.date))
          .sort((a, b) => a.date - b.date)
        if (!cancelled) setState({ status: 'ready', events })
      } catch {
        if (!cancelled) setState({ status: 'error', events: [] })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [currentUser])

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="tile-calendar">
      <p className="tile-calendar-date">{dateLabel}</p>
      {state.status === 'loading' && <p className="tile-empty">Loading today&apos;s events…</p>}
      {state.status === 'error' && <p className="tile-empty">Couldn&apos;t load events right now.</p>}
      {state.status === 'ready' && state.events.length === 0 && (
        <p className="tile-empty">Nothing scheduled today.</p>
      )}
      {state.status === 'ready' && state.events.length > 0 && (
        <ul className="tile-calendar-list">
          {state.events.map((event, index) => {
            const hasTime = event.date.getHours() !== 0 || event.date.getMinutes() !== 0
            return (
              <li key={`${event.title}-${index}`}>
                <span className="tile-calendar-time">
                  {hasTime
                    ? event.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                    : 'All day'}
                </span>
                <span className="tile-calendar-title">{event.title || 'Untitled event'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PostBody({ config }) {
  if (!config.postId) return <p className="tile-empty">No post chosen. Use Edit to pick one.</p>
  const post = getProjectPost(config.postId)
  if (!post) return <p className="tile-empty">That post is no longer available.</p>

  return (
    <article className="tile-post">
      <header className="tile-post-head">
        <strong>{post.user}</strong>
        <time>{formatPostTime(post.timestamp)}</time>
      </header>
      <div className="tile-post-body">
        {post.lines.map((runs, lineIndex) => (
          <p key={lineIndex}>
            {runs.length === 0 ? (
              <br />
            ) : (
              runs.map((run, runIndex) => {
                let content = run.text
                if (run.underline) content = <u>{content}</u>
                if (run.italic) content = <em>{content}</em>
                if (run.bold) content = <strong>{content}</strong>
                return <span key={runIndex}>{content}</span>
              })
            )}
          </p>
        ))}
      </div>
      {post.files.length > 0 && (
        <ul className="tile-post-files" aria-label="Linked files">
          {post.files.map((file) => (
            <li key={file.id}>{file.name}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

const BODIES = { text: TextBody, graph: GraphBody, calendar: CalendarBody, post: PostBody }

// ---------- Edit panel ----------

function EditPanel({ tile, onChange, onConfirm }) {
  const sources = getAnalyticsSources()
  const posts = getProjectPosts()
  const setConfig = (patch) => onChange({ config: { ...tile.config, ...patch } })

  return (
    <form
      className="tile-edit"
      onSubmit={(event) => {
        event.preventDefault()
        onConfirm()
      }}
    >
      <label className="tile-edit-field">
        <span>Title</span>
        <input
          type="text"
          value={tile.title}
          maxLength={60}
          onChange={(event) => onChange({ title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onConfirm()
            }
          }}
        />
      </label>

      {tile.type === 'text' && (
        <label className="tile-edit-field">
          <span>Message</span>
          <textarea
            rows={4}
            value={tile.config.text ?? ''}
            onChange={(event) => setConfig({ text: event.target.value })}
          />
        </label>
      )}

      {tile.type === 'graph' && (
        <>
          <label className="tile-edit-field">
            <span>Data</span>
            <select value={tile.config.sourceId ?? ''} onChange={(event) => setConfig({ sourceId: event.target.value })}>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label className="tile-edit-field">
            <span>Chart</span>
            <select value={tile.config.chart ?? 'bar'} onChange={(event) => setConfig({ chart: event.target.value })}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </label>
        </>
      )}

      {tile.type === 'post' && (
        <label className="tile-edit-field">
          <span>Post</span>
          <select
            value={tile.config.postId ?? ''}
            onChange={(event) => setConfig({ postId: event.target.value || null })}
          >
            <option value="">Choose a post…</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.user} · {formatPostTime(post.timestamp)}
              </option>
            ))}
          </select>
        </label>
      )}

      {tile.type === 'calendar' && (
        <p className="tile-edit-note">Shows whatever is on your calendar today.</p>
      )}
    </form>
  )
}

// ---------- Style menu (paint brush) ----------

function BrushIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18.37 2.63-4.37 4.37-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

// The dropdown behind the paint brush: tile style, then its color.
function StyleMenu({ tile, onChange }) {
  const current = effectiveFontSize(tile)
  const smaller = [...TEXT_SIZES].reverse().find((size) => size < current) ?? TEXT_SIZES[0]
  const larger = TEXT_SIZES.find((size) => size > current) ?? TEXT_SIZES[TEXT_SIZES.length - 1]
  const auto = tile.textSize === 'auto'

  return (
    <div className="tile-style-menu" role="group" aria-label="Tile style">
      <p className="tile-style-menu-label">Style</p>
      <div className="tile-style-menu-options">
        {TILE_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={'tile-edit-style' + (tile.style === style.id ? ' is-selected' : '')}
            aria-pressed={tile.style === style.id}
            onClick={() => onChange({ style: style.id, color: colorAfterStyleChange(style.id, tile.color) })}
          >
            {style.label}
          </button>
        ))}
      </div>
      <p className="tile-style-menu-label">Text size</p>
      <div className="tile-style-menu-options tile-style-menu-size">
        <button
          type="button"
          className="tile-edit-style"
          onClick={() => onChange({ textSize: smaller })}
          disabled={current <= TEXT_SIZES[0]}
          aria-label="Smaller text"
        >
          A−
        </button>
        <span className="tile-style-menu-readout" aria-live="polite">
          {current}px
        </span>
        <button
          type="button"
          className="tile-edit-style"
          onClick={() => onChange({ textSize: larger })}
          disabled={current >= TEXT_SIZES[TEXT_SIZES.length - 1]}
          aria-label="Larger text"
        >
          A+
        </button>
        <button
          type="button"
          className={'tile-edit-style' + (auto ? ' is-selected' : '')}
          aria-pressed={auto}
          onClick={() => onChange({ textSize: auto ? current : 'auto' })}
        >
          Fit to tile
        </button>
      </div>

      <p className="tile-style-menu-label">{tile.style === 'plain' ? 'Ink' : 'Color'}</p>
      <div className="tile-style-menu-swatches">
        {colorsForStyle(tile.style).map((color) => (
          <button
            key={color.id}
            type="button"
            className={`tile-swatch tile-swatch--${color.id}` + (tile.color === color.id ? ' is-selected' : '')}
            aria-label={color.label}
            aria-pressed={tile.color === color.id}
            onClick={() => onChange({ color: color.id })}
          />
        ))}
      </div>
    </div>
  )
}

// ---------- The tile ----------

const DRAG_THRESHOLD = 5
const INTERACTIVE = 'button, input, textarea, select, a, label, .tile-resize, .tile-controls, .tile-edit'
const STEP = CELL + GAP

// One reusable bulletin-board tile. It knows how to draw every data type and
// how to be edited, resized and dragged; the board decides what spots are
// free.
function DashboardTile({
  tile,
  editing,
  fitsSize,
  onChange,
  onEditStart,
  onConfirm,
  onCancel,
  onRemove,
  onResize,
  onDragMove,
  onDragEnd,
  onMoveBy,
}) {
  const Body = BODIES[tile.type]
  const gestureRef = useRef(null)
  const [dragOffset, setDragOffset] = useState(null)
  const [resizing, setResizing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const controlsRef = useRef(null)

  // Close the style menu / delete prompt when clicking elsewhere or pressing Escape.
  const popupOpen = menuOpen || confirmingDelete
  useEffect(() => {
    if (!popupOpen) return undefined
    function closePopups() {
      setMenuOpen(false)
      setConfirmingDelete(false)
    }
    function handlePointerDown(event) {
      if (!controlsRef.current?.contains(event.target)) closePopups()
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') closePopups()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [popupOpen])

  const sizeOptions = (dw, dh) => [
    [tile.w + dw, tile.h + dh],
    [tile.w + dw, tile.h],
    [tile.w, tile.h + dh],
  ]
  const inLimits = ([w, h]) =>
    w >= TILE_LIMITS.minW && w <= TILE_LIMITS.maxW && h >= TILE_LIMITS.minH && h <= TILE_LIMITS.maxH
  const canGrow = sizeOptions(1, 1).some((size) => inLimits(size) && fitsSize(...size))
  const canShrink = tile.w > TILE_LIMITS.minW || tile.h > TILE_LIMITS.minH

  function shrink() {
    onResize([[Math.max(TILE_LIMITS.minW, tile.w - 1), Math.max(TILE_LIMITS.minH, tile.h - 1)]])
  }

  function grow() {
    onResize(sizeOptions(1, 1).filter(inLimits))
  }

  // ----- drag the tile around the board -----
  function handleTilePointerDown(event) {
    if (editing || event.button !== 0 || event.target.closest(INTERACTIVE)) return
    gestureRef.current = { kind: 'drag', x: event.clientX, y: event.clientY, active: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTilePointerMove(event) {
    const gesture = gestureRef.current
    if (!gesture || gesture.kind !== 'drag') return
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (!gesture.active && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    gesture.active = true
    setDragOffset({ dx, dy })
    // Where the tile would land if dropped now.
    onDragMove(Math.round((tile.x * STEP + dx) / STEP), Math.round((tile.y * STEP + dy) / STEP))
  }

  function finishDrag(commit) {
    const gesture = gestureRef.current
    if (!gesture || gesture.kind !== 'drag') return
    gestureRef.current = null
    // onDragEnd(true) means "cancelled": the board just clears its preview.
    onDragEnd(!(gesture.active && commit))
    setDragOffset(null)
  }

  // ----- drag the bottom-right corner to resize -----
  function handleResizeDown(event) {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    gestureRef.current = { kind: 'resize', x: event.clientX, y: event.clientY, w: tile.w, h: tile.h }
    setResizing(true)
  }

  function handleResizeMove(event) {
    const gesture = gestureRef.current
    if (!gesture || gesture.kind !== 'resize') return
    const w = gesture.w + Math.round((event.clientX - gesture.x) / STEP)
    const h = gesture.h + Math.round((event.clientY - gesture.y) / STEP)
    const clampedW = Math.min(TILE_LIMITS.maxW, Math.max(TILE_LIMITS.minW, w))
    const clampedH = Math.min(TILE_LIMITS.maxH, Math.max(TILE_LIMITS.minH, h))
    onResize([[clampedW, clampedH], [clampedW, tile.h], [tile.w, clampedH]])
  }

  function handleResizeUp() {
    gestureRef.current = null
    setResizing(false)
  }

  // Finishing or cancelling an edit also closes the style menu.
  function handleConfirm() {
    setMenuOpen(false)
    onConfirm()
  }

  function handleCancel() {
    setMenuOpen(false)
    onCancel()
  }

  // Arrow keys move a focused tile one cell at a time.
  function handleKeyDown(event) {
    if (editing && event.key === 'Escape') {
      event.preventDefault()
      handleCancel()
      return
    }
    if (event.target !== event.currentTarget) return
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    onMoveBy(move[0], move[1])
  }

  const dragging = dragOffset !== null
  const hintId = `${tile.id}-hint`
  const style = {
    left: tile.x * STEP,
    top: tile.y * STEP,
    width: tile.w * CELL + (tile.w - 1) * GAP,
    height: tile.h * CELL + (tile.h - 1) * GAP,
    '--tile-font': `${effectiveFontSize(tile)}px`,
    '--tilt': `${editing || dragging || resizing || tile.style === 'plain' ? 0 : tiltFor(tile.id)}deg`,
    transform: dragging
      ? `translate(${dragOffset.dx}px, ${dragOffset.dy}px) rotate(1.2deg)`
      : undefined,
  }

  return (
    <section
      className={
        `tile tile--${tile.style} tile-c--${tile.color}` +
        (editing ? ' is-editing' : '') +
        (dragging ? ' is-dragging' : '') +
        (resizing ? ' is-resizing' : '') +
        (popupOpen ? ' is-menu-open' : '')
      }
      style={style}
      tabIndex={0}
      aria-label={tile.title || 'Untitled tile'}
      aria-describedby={hintId}
      onPointerDown={handleTilePointerDown}
      onPointerMove={handleTilePointerMove}
      onPointerUp={() => finishDrag(true)}
      onPointerCancel={() => finishDrag(false)}
      onKeyDown={handleKeyDown}
    >
      <span id={hintId} className="tile-sr-only">
        Drag to move, or use the arrow keys.
      </span>

      {tile.style === 'paper' && <span className="tile-pin" aria-hidden="true" />}

      <div ref={controlsRef} className="tile-controls" role="toolbar" aria-label={`${tile.title || 'Tile'} options`}>
        {!editing && (
          <button type="button" onClick={onEditStart} aria-label="Edit tile" title="Edit">✎</button>
        )}
        <button
          type="button"
          className={menuOpen ? 'is-active' : ''}
          onClick={() => {
            setConfirmingDelete(false)
            setMenuOpen((open) => !open)
          }}
          aria-label="Tile style"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          title="Style"
        >
          <BrushIcon />
        </button>
        {!editing && (
          <>
            <button type="button" onClick={shrink} disabled={!canShrink} aria-label="Make smaller" title="Smaller">−</button>
            <button type="button" onClick={grow} disabled={!canGrow} aria-label="Make larger" title="Larger">+</button>
          </>
        )}
        {editing && (
          <button type="button" onClick={handleConfirm} aria-label="Save changes" title="Save changes">
            <CheckIcon />
          </button>
        )}
        <button
          type="button"
          className={editing ? '' : 'tile-delete'}
          onClick={() => {
            if (editing) {
              handleCancel()
            } else {
              setMenuOpen(false)
              setConfirmingDelete((open) => !open)
            }
          }}
          aria-label={editing ? 'Cancel editing' : 'Delete tile'}
          aria-haspopup={editing ? undefined : 'dialog'}
          aria-expanded={editing ? undefined : confirmingDelete}
          title={editing ? 'Cancel' : 'Delete'}
        >
          ✕
        </button>
        {menuOpen && <StyleMenu tile={tile} onChange={onChange} />}
        {confirmingDelete && !editing && (
          <div className="tile-delete-prompt" role="alertdialog" aria-label="Delete this tile?">
            <p>Delete?</p>
            <div className="tile-delete-prompt-actions">
              <button type="button" className="tile-delete-yes" onClick={onRemove}>
                Delete
              </button>
              <button type="button" className="tile-delete-no" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tile-inner">
        {tile.title && <h3 className="tile-title">{tile.title}</h3>}
        <div className="tile-body">
          {editing ? <EditPanel tile={tile} onChange={onChange} onConfirm={handleConfirm} /> : <Body config={tile.config} />}
        </div>
      </div>

      <span
        className="tile-resize"
        role="presentation"
        title="Drag to resize"
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
      />
    </section>
  )
}

export default DashboardTile