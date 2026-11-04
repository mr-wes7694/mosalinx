// Small date helpers shared by the messaging components.

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function startOfDay(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

// "Today", "Yesterday", or a full date, used for the dividers in the feed.
export function formatDay(iso) {
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export function dayKey(iso) {
  return startOfDay(new Date(iso)).getTime()
}
