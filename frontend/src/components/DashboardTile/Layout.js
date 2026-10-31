// Grid placement for the bulletin board. Everything here is plain math on
// rectangles measured in grid cells: { x, y, w, h }. Tiles may never overlap
// and may never hang off the right edge.

export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

export function fits(others, rect, columns) {
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > columns) return false
  return !others.some((other) => overlaps(other, rect))
}

function bottomOf(rects) {
  return rects.reduce((max, rect) => Math.max(max, rect.y + rect.h), 0)
}

// The first open spot reading left to right, top to bottom.
export function firstFree(others, w, h, columns) {
  const width = Math.min(w, columns)
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + width <= columns; x += 1) {
      if (fits(others, { x, y, w: width, h }, columns)) return { x, y }
    }
  }
}

// The open spot closest to where the tile was dropped.
export function nearestFree(others, w, h, targetX, targetY, columns) {
  const width = Math.min(w, columns)
  const maxY = bottomOf(others) + 1
  let best = null
  for (let y = 0; y <= maxY; y += 1) {
    for (let x = 0; x + width <= columns; x += 1) {
      if (!fits(others, { x, y, w: width, h }, columns)) continue
      const distance = (x - targetX) ** 2 + (y - targetY) ** 2
      if (!best || distance < best.distance) best = { x, y, distance }
    }
  }
  return best ? { x: best.x, y: best.y } : firstFree(others, w, h, columns)
}

// Gives every tile a valid, non-overlapping position for the current number
// of columns. Tiles keep their saved spot when it is still free; tiles with
// no saved spot or whose spot no longer fits move to the nearest free one.
export function resolveLayout(tiles, columns) {
  const placed = []
  return tiles.map((tile) => {
    const w = Math.min(tile.w, columns)
    const hasSpot = Number.isInteger(tile.x) && Number.isInteger(tile.y)
    let spot
    if (hasSpot && fits(placed, { x: tile.x, y: tile.y, w, h: tile.h }, columns)) {
      spot = { x: tile.x, y: tile.y }
    } else if (hasSpot) {
      spot = nearestFree(placed, w, tile.h, tile.x, tile.y, columns)
    } else {
      spot = firstFree(placed, w, tile.h, columns)
    }
    const next = { ...tile, w, x: spot.x, y: spot.y }
    placed.push(next)
    return next
  })
}