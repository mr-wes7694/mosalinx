// Shared definitions for dashboard tiles.
//
// A tile is plain data, so it can be saved as JSON and stored in the
// backend:
//   { id, type, title, style, color, textSize, x, y, w, h, config }
// x / y is the tile's top-left cell and w / h its size in grid cells.
// textSize is 'auto' or a font size in px.
// `config` depends on the type:
//   text:     { text }
//   graph:    { sourceId, chart: 'bar' | 'line' }
//   calendar: {}
//   post:     { postId }

export const TILE_TYPES = [
  { id: 'text', label: 'Message', description: 'A note from the team lead' },
  { id: 'graph', label: 'Graph', description: 'Analytics chart' },
  { id: 'calendar', label: 'Today', description: "Today's calendar events" },
  { id: 'post', label: 'Project post', description: 'Pin a post from the workspace' },
]

// How a tile looks on the board. "plain" has no paper at all, so the content
// reads as if it were written straight onto the cork.
export const TILE_STYLES = [
  { id: 'sticky', label: 'Sticky note' },
  { id: 'paper', label: 'Pinned paper' },
  { id: 'plain', label: 'On the board' },
]

const NOTE_COLORS = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'pink', label: 'Pink' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'cream', label: 'Cream' },
]

// For plain tiles the color is the ink the content is written in.
const INK_COLORS = [
  { id: 'black', label: 'Black ink' },
  { id: 'white', label: 'White ink' },
  { id: 'yellow', label: 'Yellow chalk' },
  { id: 'navy', label: 'Navy ink' },
  { id: 'red', label: 'Red ink' },
]

export const STYLE_COLORS = { sticky: NOTE_COLORS, paper: NOTE_COLORS, plain: INK_COLORS }
const DEFAULT_COLOR = { sticky: 'yellow', paper: 'cream', plain: 'black' }

export function colorsForStyle(style) {
  return STYLE_COLORS[style] ?? NOTE_COLORS
}

// Switching style keeps the color when it still makes sense, otherwise falls
// back to that style's default.
export function colorAfterStyleChange(style, color) {
  return colorsForStyle(style).some((c) => c.id === color) ? color : DEFAULT_COLOR[style]
}

// Text size steps for the A- / A+ buttons, in px.
export const TEXT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40, 48]

// "Fit to tile": the text grows and shrinks with the tile's area.
export function autoFontSize(w, h) {
  return Math.round(5 + 3.6 * Math.sqrt(w * h))
}

export function effectiveFontSize(tile) {
  return typeof tile.textSize === 'number' ? tile.textSize : autoFontSize(tile.w, tile.h)
}

export const TILE_LIMITS = { minW: 2, maxW: 8, minH: 2, maxH: 6 }

// Grid geometry, in px. The board and the tiles both use it.
export const CELL = 110
export const GAP = 22

const DEFAULTS = {
  text: { title: 'Message', style: 'sticky', color: 'yellow', textSize: 'auto', w: 3, h: 2, config: { text: '' } },
  graph: { title: 'Analytics', style: 'paper', color: 'cream', textSize: 'auto', w: 4, h: 3, config: { sourceId: 'file-activity', chart: 'bar' } },
  calendar: { title: 'Today', style: 'paper', color: 'cream', textSize: 'auto', w: 3, h: 3, config: {} },
  post: { title: 'Project post', style: 'paper', color: 'cream', textSize: 'auto', w: 4, h: 3, config: { postId: null } },
}

let counter = 0
export function newTileId() {
  counter += 1
  return `tile-${Date.now().toString(36)}-${counter}`
}

// New tiles have no x / y; the board puts them in the first free spot.
export function createTile(type) {
  const base = DEFAULTS[type] ?? DEFAULTS.text
  return { id: newTileId(), type: DEFAULTS[type] ? type : 'text', ...base, config: { ...base.config } }
}

function clamp(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

// Anything read back from storage goes through here, so a stale
// entry can't crash the board. It also upgrades boards saved before tile styles existed.
export function sanitizeTile(raw) {
  if (!raw || typeof raw !== 'object' || !DEFAULTS[raw.type]) return null
  const base = DEFAULTS[raw.type]

  let style = raw.style
  let color = raw.color
  if (!TILE_STYLES.some((s) => s.id === style)) {
    style = color === 'paper' ? 'paper' : color ? 'sticky' : base.style
  }
  if (color === 'paper') color = 'cream'
  color = colorAfterStyleChange(style, color ?? DEFAULT_COLOR[style])

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newTileId(),
    type: raw.type,
    title: typeof raw.title === 'string' ? raw.title.slice(0, 60) : base.title,
    style,
    color,
    textSize:
      typeof raw.textSize === 'number' && Number.isFinite(raw.textSize)
        ? Math.min(64, Math.max(9, Math.round(raw.textSize)))
        : 'auto',
    x: Number.isInteger(raw.x) && raw.x >= 0 ? raw.x : undefined,
    y: Number.isInteger(raw.y) && raw.y >= 0 ? raw.y : undefined,
    w: clamp(raw.w, TILE_LIMITS.minW, TILE_LIMITS.maxW, base.w),
    h: clamp(raw.h, TILE_LIMITS.minH, TILE_LIMITS.maxH, base.h),
    config: { ...base.config, ...(raw.config && typeof raw.config === 'object' ? raw.config : {}) },
  }
}