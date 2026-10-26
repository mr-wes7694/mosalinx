import { useEffect, useMemo, useRef, useState } from 'react'
import { useProject } from '../context/useProject'
import DashboardTile from '../components/DashboardTile/DashboardTile.jsx'
import { fits, firstFree, nearestFree, resolveLayout } from '../components/DashboardTile/layout.js'
import { CELL, GAP, TILE_TYPES, createTile, sanitizeTile } from '../components/DashboardTile/tileConfig.js'
import './Dashboard.css'

// The dashboard is a cork bulletin board of tiles. Layout is saved in this
// browser, per project, until there is a backend table for it.

const STARTER_TILES = () => {
  const welcome = createTile('text')
  welcome.title = 'Welcome'
  welcome.config.text = 'Pin messages, charts, today’s schedule and project posts here. Hover a tile to edit or resize it.'
  return [welcome, createTile('calendar')]
}

function loadTiles(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey))
    if (Array.isArray(saved)) return saved.map(sanitizeTile).filter(Boolean)
  } catch {
    // unreadable or unavailable
  }
  return STARTER_TILES()
}

function saveTiles(storageKey, tiles) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tiles))
  } catch {
    // storage unavailable
  }
}

// The project title that heads the board. It doubles as a dropdown for
// switching to any of the user's other projects.
function ProjectSwitcher({ projects, activeProject, loading, error, onSelect }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const title = loading ? 'Loading projects…' : activeProject?.project_name || 'No project selected'
  const canSwitch = !loading && projects.length > 0

  // Escape closes; Up/Down move between projects.
  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = [...(listRef.current?.querySelectorAll('button') ?? [])]
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement)
    const step = event.key === 'ArrowDown' ? 1 : -1
    items[(index + step + items.length) % items.length].focus()
  }

  return (
    <h1 className="board-project" ref={wrapRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="board-project-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!canSwitch}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="board-project-name">{title}</span>
        {canSwitch && (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
      {error && !loading && projects.length === 0 && <span className="board-project-error">{error}</span>}
      {open && (
        <ul ref={listRef} className="board-project-menu" role="listbox" aria-label="Switch project">
          {projects.map((project) => {
            const selected = project.project_id === activeProject?.project_id
            return (
              <li key={project.project_id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? 'is-selected' : ''}
                  onClick={() => {
                    setOpen(false)
                    if (!selected) onSelect(project)
                  }}
                >
                  <span>{project.project_name}</span>
                  {selected && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </h1>
  )
}

function Board({ storageKey, switcher }) {
  const [tiles, setTiles] = useState(() => loadTiles(storageKey))
  const [editingId, setEditingId] = useState(null)
  // What the tile looked like when editing began, so Cancel can put it back
  // (or remove the tile again if it was only just added).
  const [editStart, setEditStart] = useState(null) // { id, isNew, tile }
  const [menuOpen, setMenuOpen] = useState(false)
  const [columns, setColumns] = useState(6)
  const [dragPreview, setDragPreview] = useState(null) // { id, x, y }
  const fieldRef = useRef(null)

  // Every tile with a valid spot for the current width. Saved spots are kept
  // whenever they are still free.
  const layout = useMemo(() => resolveLayout(tiles, columns), [tiles, columns])

  useEffect(() => {
    saveTiles(storageKey, tiles)
  }, [storageKey, tiles])

  // As many whole grid cells as fit across the board.
  useEffect(() => {
    const field = fieldRef.current
    if (!field || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setColumns(Math.max(2, Math.floor((width + GAP) / (CELL + GAP))))
    })
    observer.observe(field)
    return () => observer.disconnect()
  }, [])

  const othersOf = (id) => layout.filter((tile) => tile.id !== id)

  // Where a dragged tile would settle its target cell if free, otherwise the
  // closest free cell, so tiles can never overlap.
  function settleSpot(tile, targetX, targetY) {
    const others = othersOf(tile.id)
    const clampedX = Math.min(Math.max(0, targetX), columns - tile.w)
    const clampedY = Math.max(0, targetY)
    return nearestFree(others, tile.w, tile.h, clampedX, clampedY, columns)
  }

  function addTile(type) {
    const tile = createTile(type)
    const spot = firstFree(layout, tile.w, tile.h, columns)
    // Bake the current layout in so existing tiles stay exactly where they are.
    setTiles([...layout, { ...tile, ...spot }])
    setEditingId(tile.id)
    setEditStart({ id: tile.id, isNew: true, tile })
    setMenuOpen(false)
  }

  function updateTile(id, patch) {
    setTiles(layout.map((tile) => (tile.id === id ? { ...tile, ...patch } : tile)))
  }

  function startEdit(id) {
    const tile = layout.find((t) => t.id === id)
    if (!tile) return
    setEditingId(id)
    setEditStart({ id, isNew: false, tile })
  }

  function confirmEdit() {
    setEditingId(null)
    setEditStart(null)
  }

  function cancelEdit(id) {
    if (editStart && editStart.id === id) {
      if (editStart.isNew) {
        removeTile(id)
      } else {
        const { title, style, color, textSize, config } = editStart.tile
        updateTile(id, { title, style, color, textSize, config })
      }
    }
    setEditingId(null)
    setEditStart(null)
  }

  function removeTile(id) {
    setTiles(layout.filter((tile) => tile.id !== id))
    setEditingId((current) => (current === id ? null : current))
  }

  // Tries each requested size in order and uses the first one that fits.
  function resizeTile(id, sizes) {
    const tile = layout.find((t) => t.id === id)
    if (!tile) return
    const others = othersOf(id)
    const size = sizes.find(([w, h]) => fits(others, { x: tile.x, y: tile.y, w, h }, columns))
    if (size && (size[0] !== tile.w || size[1] !== tile.h)) {
      updateTile(id, { w: size[0], h: size[1] })
    }
  }

  function fitsSize(id, w, h) {
    const tile = layout.find((t) => t.id === id)
    return !!tile && fits(othersOf(id), { x: tile.x, y: tile.y, w, h }, columns)
  }

  function previewDrag(id, targetX, targetY) {
    const tile = layout.find((t) => t.id === id)
    if (!tile) return
    const spot = settleSpot(tile, targetX, targetY)
    setDragPreview((current) =>
      current && current.id === id && current.x === spot.x && current.y === spot.y
        ? current
        : { id, x: spot.x, y: spot.y }
    )
  }

  function endDrag(id, cancelled) {
    if (!cancelled && dragPreview && dragPreview.id === id) {
      updateTile(id, { x: dragPreview.x, y: dragPreview.y })
    }
    setDragPreview(null)
  }

  // One cell at a time, only into free space.
  function moveBy(id, dx, dy) {
    const tile = layout.find((t) => t.id === id)
    if (!tile) return
    const rect = { x: tile.x + dx, y: tile.y + dy, w: tile.w, h: tile.h }
    if (fits(othersOf(id), rect, columns)) updateTile(id, { x: rect.x, y: rect.y })
  }

  // Room below the lowest tile so there is always somewhere to drop one.
  const dragging = dragPreview ? layout.find((tile) => tile.id === dragPreview.id) : null
  const bottom = layout.reduce((max, tile) => Math.max(max, tile.y + tile.h), 0)
  const previewBottom = dragging ? dragPreview.y + dragging.h : 0
  const rows = Math.max(bottom, previewBottom) + 2
  const canvasStyle = {
    width: columns * CELL + (columns - 1) * GAP,
    height: rows * (CELL + GAP) - GAP,
  }

  return (
    <div className="dashboard-page">
      <div className="board-frame">
        <div className="board-cork" onKeyDown={(event) => event.key === 'Escape' && setMenuOpen(false)}>
          <div className="board-toolbar">
            {switcher}
            <div className="board-add">
              <button
                type="button"
                className="board-add-button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                + Add tile
              </button>
              {menuOpen && (
                <ul className="board-add-menu" role="menu">
                  {TILE_TYPES.map((type) => (
                    <li key={type.id} role="none">
                      <button type="button" role="menuitem" onClick={() => addTile(type.id)}>
                        <strong>{type.label}</strong>
                        <span>{type.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div ref={fieldRef} className="board-field">
            <div className="board-canvas" style={canvasStyle}>
              {dragging && (
                <span
                  className="board-ghost"
                  aria-hidden="true"
                  style={{
                    left: dragPreview.x * (CELL + GAP),
                    top: dragPreview.y * (CELL + GAP),
                    width: dragging.w * CELL + (dragging.w - 1) * GAP,
                    height: dragging.h * CELL + (dragging.h - 1) * GAP,
                  }}
                />
              )}
              {layout.map((tile) => (
                <DashboardTile
                  key={tile.id}
                  tile={tile}
                  editing={editingId === tile.id}
                  fitsSize={(w, h) => fitsSize(tile.id, w, h)}
                  onChange={(patch) => updateTile(tile.id, patch)}
                  onEditStart={() => startEdit(tile.id)}
                  onConfirm={confirmEdit}
                  onCancel={() => cancelEdit(tile.id)}
                  onRemove={() => removeTile(tile.id)}
                  onResize={(sizes) => resizeTile(tile.id, sizes)}
                  onDragMove={(x, y) => previewDrag(tile.id, x, y)}
                  onDragEnd={(cancelled) => endDrag(tile.id, cancelled)}
                  onMoveBy={(dx, dy) => moveBy(tile.id, dx, dy)}
                />
              ))}
            </div>
          </div>

          {tiles.length === 0 && (
            <p className="board-empty">The board is empty. Use Add tile to pin something.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { projects, activeProject, setActiveProject, loadingProjects, projectError } = useProject()
  const projectKey = activeProject?.project_id ?? 'none'

  const switcher = (
    <ProjectSwitcher
      projects={projects ?? []}
      activeProject={activeProject}
      loading={loadingProjects}
      error={projectError}
      onSelect={setActiveProject}
    />
  )

  // Keyed by project so switching projects loads that project's board.
  return <Board key={projectKey} storageKey={`mosalinx.dashboard.${projectKey}`} switcher={switcher} />
}

export default Dashboard