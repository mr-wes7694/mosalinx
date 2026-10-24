// Where the dashboard tiles get their data.
//
// Calendar tiles read the real /api/calendar/events endpoint via
// DashboardTile.jsx. The two sources below don't have a backend yet, so they
// return sample data in the final shape. When the analytics page and the
// workspace-posts API exist, replace the bodies of these functions and the
// tiles won't need to change.

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

// ---------- Project posts (post tiles) ----------
// Posts currently live in the Workspace page's local state, so
// the dashboard can't see them yet. Once they come from the backend, 
// return them here. Shape matches the Workspace feed:
// { id, user, timestamp, lines: [[{ text, bold, italic, underline }]],
//   files: [{ id, name }] }
const NOW = Date.now()
const HOUR = 60 * 60 * 1000

const SAMPLE_POSTS = [
  {
    id: 'post-1',
    user: 'Veronica Johnson',
    timestamp: NOW - 1 * HOUR,
    lines: [
      [
        { text: 'Budget update: ', bold: true },
        { text: 'refreshed hosting and licensing costs to match the latest vendor quotes.' },
      ],
      [{ text: 'Let me know if anything looks off before the client review.', italic: true }],
    ],
    files: [{ id: 'file-budget', name: 'Budget.mosheet' }],
  },
  {
    id: 'post-2',
    user: 'Lesly Martinez',
    timestamp: NOW - 5 * HOUR,
    lines: [[{ text: 'Filtered the user report to active accounts only and sorted by most recent login.' }]],
    files: [{ id: 'file-query', name: 'active_users.sql' }],
  },
  {
    id: 'post-3',
    user: 'Veronica Johnson',
    timestamp: NOW - 26 * HOUR,
    lines: [
      [{ text: 'Added the overview section and next steps to the proposal.' }],
      [{ text: 'The pitch deck still needs the problem slide tightened up.' }],
    ],
    files: [
      { id: 'file-proposal', name: 'Client Proposal.modoc' },
      { id: 'file-pitch', name: 'Pitch Deck.moslide' },
    ],
  },
]

export function getProjectPosts() {
  return SAMPLE_POSTS
}

export function getProjectPost(id) {
  return SAMPLE_POSTS.find((post) => post.id === id) ?? null
}