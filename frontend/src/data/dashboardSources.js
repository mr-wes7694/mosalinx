// Sample analytics data for Dashboard graph tiles.
//
// Calendar tiles retrieve real events through the Calendar API, while
// Project Post tiles retrieve real Workspace posts through Dashboard.jsx.
// Analytics graph tiles continue using sample data until backend integration.

// ---------- Analytics (graph tiles) ----------
// Backend dev: the analytics page will own this. A graph tile only stores a
// source id plus a chart style, and looks the data up here.
// Shape: { id, label, unit, labels: string[], values: number[] }
const ANALYTICS_SOURCES = [
  {
    id: 'file-activity',
    label: 'File activity this week',
    unit: 'edits',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [14, 22, 9, 31, 18, 4, 2],
  },
  {
    id: 'posts-per-week',
    label: 'Posts per week',
    unit: 'posts',
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'],
    values: [6, 9, 7, 12, 10],
  },
  {
    id: 'tasks-completed',
    label: 'Tasks completed',
    unit: 'tasks',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    values: [3, 5, 2, 8, 6],
  },
]

export function getAnalyticsSources() {
  return ANALYTICS_SOURCES
}

export function getAnalyticsSource(id) {
  return ANALYTICS_SOURCES.find((source) => source.id === id) ?? null
}
