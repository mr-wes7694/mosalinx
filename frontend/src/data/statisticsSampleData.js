// DEMONSTRATION CONTENT ONLY.
// Sample projects, tasks and people for the Statistics prototype. Nothing is
// read from or written to a backend. People and project names match the
// Messaging prototype so the two tabs tell one story.
//
// Every number shown on the Statistics page is derived from the task lists
// below by the helper functions at the bottom, so the summary, project
// overview, task table and workload views cannot disagree with each other.
// A backend can later return `{ ...project, tasks }` in this same shape.
//
//   task { key, title, status, priority, assignee (member id | null),
//          points, progress (0-100), dueIn (days from today), doneWeeksAgo?,
//          blockedReason? }

import { SAMPLE_PROJECTS } from './messagingSampleData.js'

export const STATUSES = [
  { id: 'todo', label: 'To do', color: '#8a8f98' },
  { id: 'in_progress', label: 'In progress', color: '#3b82c4' },
  { id: 'in_review', label: 'In review', color: '#8e6bd6' },
  { id: 'blocked', label: 'Blocked', color: '#e5484d' },
  { id: 'done', label: 'Done', color: '#2e9e6b' },
]

export const PRIORITIES = [
  { id: 'highest', label: 'Highest', rank: 0, color: '#d92d20' },
  { id: 'high', label: 'High', rank: 1, color: '#f08a24' },
  { id: 'medium', label: 'Medium', rank: 2, color: '#d9a21b' },
  { id: 'low', label: 'Low', rank: 3, color: '#3b82c4' },
]

export const PROJECT_STATUS_LABELS = { active: 'Active', on_hold: 'On hold' }

// Story points each person can take on in a sprint.
const CAPACITY = { me: 10, alex: 8, priya: 10, marcus: 10, dana: 8, sam: 8 }

const t = (key, title, status, priority, assignee, points, progress, dueIn, extra = {}) => ({
  key, title, status, priority, assignee, points, progress, dueIn, ...extra,
})

const TASKS = {
  capstone: [
    t('CT-101', 'Set up Vite and routing', 'done', 'high', 'marcus', 3, 100, -20, { doneWeeksAgo: 3 }),
    t('CT-104', 'Firebase sign-in flow', 'done', 'highest', 'marcus', 5, 100, -14, { doneWeeksAgo: 2 }),
    t('CT-109', 'Workspace feed overlay', 'done', 'high', 'priya', 5, 100, -8, { doneWeeksAgo: 1 }),
    t('CT-112', 'Calendar events endpoint', 'done', 'medium', 'marcus', 3, 100, -4, { doneWeeksAgo: 0 }),
    t('CT-115', 'Dashboard bulletin board', 'done', 'high', 'priya', 5, 100, -2, { doneWeeksAgo: 0 }),
    t('CT-118', 'Messaging UI prototype', 'in_progress', 'highest', 'priya', 5, 70, 3),
    t('CT-120', 'Statistics page prototype', 'in_progress', 'high', 'me', 5, 40, 5),
    t('CT-121', 'Logo and brand assets', 'in_progress', 'medium', 'dana', 3, 60, 2),
    t('CT-123', 'API documentation', 'in_progress', 'low', 'marcus', 3, 30, 6),
    t('CT-128', 'Rate limiting on the API', 'in_progress', 'medium', 'marcus', 4, 25, 8),
    t('CT-117', 'Settings preferences', 'in_review', 'medium', 'me', 2, 90, 1),
    t('CT-119', 'Frontend lint cleanup', 'in_review', 'low', 'sam', 2, 95, 0),
    t('CT-122', 'Today tile calendar integration', 'blocked', 'high', 'marcus', 3, 50, -1, { blockedReason: 'Waiting on the calendar API contract' }),
    t('CT-124', 'Production deployment', 'blocked', 'highest', 'alex', 5, 10, 7, { blockedReason: 'Hosting account not approved yet' }),
    t('CT-125', 'Usability test plan', 'todo', 'medium', 'sam', 3, 0, 9),
    t('CT-126', 'Sprint demo script', 'todo', 'low', 'alex', 1, 0, 4),
    t('CT-127', 'Accessibility audit', 'todo', 'high', null, 3, 0, 12),
    t('CT-129', 'Error logging', 'todo', 'low', 'marcus', 3, 0, 10),
  ],
  garden: [
    t('CG-11', 'Order seed packets', 'done', 'medium', 'sam', 2, 100, -10, { doneWeeksAgo: 2 }),
    t('CG-12', 'Build raised beds', 'done', 'high', 'alex', 5, 100, -6, { doneWeeksAgo: 1 }),
    t('CG-13', 'Volunteer sign-up sheet', 'done', 'low', 'dana', 1, 100, -3, { doneWeeksAgo: 0 }),
    t('CG-14', 'Plan planting day', 'in_progress', 'highest', 'dana', 3, 65, 2),
    t('CG-15', 'Install rain barrels', 'in_progress', 'medium', 'alex', 3, 40, 6),
    t('CG-16', 'Compost bin signage', 'in_review', 'low', 'sam', 1, 90, 1),
    t('CG-17', 'Irrigation permit', 'blocked', 'high', 'me', 2, 20, 3, { blockedReason: 'Waiting on campus facilities' }),
    t('CG-18', 'Open day flyer', 'todo', 'medium', 'dana', 2, 0, 11),
  ],
  podcast: [
    t('PP-1', 'Episode 1 outline', 'done', 'high', 'marcus', 2, 100, -6, { doneWeeksAgo: 1 }),
    t('PP-2', 'Record cold open', 'in_progress', 'high', 'priya', 3, 50, 4),
    t('PP-3', 'Intro music licensing', 'in_progress', 'medium', 'marcus', 2, 30, 7),
    t('PP-4', 'Guest shortlist', 'todo', 'medium', 'priya', 2, 0, 12),
    t('PP-5', 'Cover art', 'todo', 'low', null, 3, 0, 14),
    t('PP-6', 'Publishing checklist', 'todo', 'low', 'marcus', 1, 0, 16),
  ],
  newproj: [],
}

// Messaging gives each project its name, color and members; this adds the
// project-management fields.
const PROJECT_INFO = {
  capstone: { status: 'active', description: 'Final-term capstone web app: workspace, dashboard, messaging and analytics.' },
  garden: { status: 'active', description: 'Volunteer-run garden beds and compost program on campus.' },
  podcast: { status: 'on_hold', description: 'Pilot season of a student podcast. Paused until spring.' },
  newproj: { status: 'active', description: 'Just created. Nothing planned yet.' },
}

export const STATS_PROJECTS = SAMPLE_PROJECTS.map((project) => ({
  id: project.id,
  name: project.name,
  short: project.short,
  color: project.color,
  ...PROJECT_INFO[project.id],
  members: project.members.map((m) => ({ ...m, capacity: CAPACITY[m.id] ?? 8 })),
  tasks: TASKS[project.id] ?? [],
}))

// ---------- Derived numbers (the single source for every figure) ----------

export function countByStatus(tasks) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s.id, 0]))
  tasks.forEach((task) => { counts[task.status] += 1 })
  return counts
}

export function countByPriority(tasks) {
  const counts = Object.fromEntries(PRIORITIES.map((p) => [p.id, 0]))
  tasks.forEach((task) => { counts[task.priority] += 1 })
  return counts
}

export const isOpen = (task) => task.status !== 'done'
export const isOverdue = (task) => isOpen(task) && task.dueIn < 0

export function summarize(tasks) {
  const counts = countByStatus(tasks)
  const total = tasks.length
  const points = tasks.reduce((sum, task) => sum + task.points, 0)
  const donePoints = tasks.filter((task) => task.status === 'done').reduce((sum, task) => sum + task.points, 0)
  return {
    total,
    counts,
    open: total - counts.done,
    overdue: tasks.filter(isOverdue).length,
    points,
    donePoints,
    percent: total === 0 ? 0 : Math.round((counts.done / total) * 100),
  }
}

// Completed tasks per week for the last four weeks, in the shape the
// dashboard's graph tile expects.
export function weeklyCompletedSource(tasks) {
  const values = [0, 0, 0, 0]
  tasks.forEach((task) => {
    if (task.status === 'done') values[3 - task.doneWeeksAgo] += 1
  })
  return {
    id: 'weekly-completed',
    label: 'Tasks completed per week',
    unit: 'tasks',
    labels: ['3 wks ago', '2 wks ago', 'Last wk', 'This wk'],
    values,
  }
}

// Open work per person. Capacity is per person, so across projects a
// person's points are added up and compared with their single capacity.
export function workloadFor(projects) {
  const people = new Map()
  const unassigned = { tasks: 0, points: 0 }
  projects.forEach((project) => {
    project.tasks.filter(isOpen).forEach((task) => {
      if (!task.assignee) {
        unassigned.tasks += 1
        unassigned.points += task.points
        return
      }
      const member = project.members.find((m) => m.id === task.assignee)
      const entry = people.get(member.id) ?? { member, counts: Object.fromEntries(STATUSES.map((s) => [s.id, 0])), tasks: 0, points: 0, done: 0 }
      entry.counts[task.status] += 1
      entry.tasks += 1
      entry.points += task.points
      people.set(member.id, entry)
    })
    project.tasks.filter((task) => !isOpen(task) && task.assignee).forEach((task) => {
      const member = project.members.find((m) => m.id === task.assignee)
      const entry = people.get(member.id) ?? { member, counts: Object.fromEntries(STATUSES.map((s) => [s.id, 0])), tasks: 0, points: 0, done: 0 }
      entry.done += 1
      people.set(member.id, entry)
    })
  })
  return { people: [...people.values()].sort((a, b) => b.points / b.member.capacity - a.points / a.member.capacity), unassigned }
}
