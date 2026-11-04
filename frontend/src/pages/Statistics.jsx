import { useRef, useState } from 'react'
import { PRIORITIES, STATS_PROJECTS, STATUSES, summarize, workloadFor } from '../data/statisticsSampleData.js'
import SummaryMetrics from '../components/Statistics/SummaryMetrics.jsx'
import ProjectOverview from '../components/Statistics/ProjectOverview.jsx'
import ProjectDetail from '../components/Statistics/ProjectDetail.jsx'
import TaskTable from '../components/Statistics/TaskTable.jsx'
import WorkloadPanel from '../components/Statistics/WorkloadPanel.jsx'
import './Statistics.css'

// Prototype Statistics page. It goes deeper than the Dashboard: portfolio
// numbers, per-project progress, a filterable task list and team workload.
// All figures come from the local sample data in statisticsSampleData.js,
// so nothing here is live. Selecting a project drives the detail, task and
// workload sections together.

const ROWS = STATS_PROJECTS.map((project) => ({ project, summary: summarize(project.tasks) }))
const PORTFOLIO = summarize(STATS_PROJECTS.flatMap((project) => project.tasks))
const ACTIVE_PROJECTS = STATS_PROJECTS.filter((project) => project.status === 'active').length

// How each sortable column orders two tasks.
const SORTERS = {
  task: (a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }),
  status: (a, b) => STATUSES.findIndex((s) => s.id === a.status) - STATUSES.findIndex((s) => s.id === b.status),
  priority: (a, b) => PRIORITIES.find((p) => p.id === a.priority).rank - PRIORITIES.find((p) => p.id === b.priority).rank,
  assignee: (a, b) => (a.assignee ?? '~').localeCompare(b.assignee ?? '~'),
  progress: (a, b) => a.progress - b.progress,
  due: (a, b) => (a.status === 'done' ? 999 : a.dueIn) - (b.status === 'done' ? 999 : b.dueIn),
}

function Statistics() {
  const [projectId, setProjectId] = useState(STATS_PROJECTS[0].id)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'priority', dir: 'asc' })
  const [scope, setScope] = useState('project')
  const tasksRef = useRef(null)

  const { project, summary } = ROWS.find((row) => row.project.id === projectId)

  const needle = query.trim().toLowerCase()
  const visibleTasks = project.tasks
    .filter((task) => statusFilter === 'all' || task.status === statusFilter)
    .filter((task) => !needle || `${task.key} ${task.title}`.toLowerCase().includes(needle))
    .sort((a, b) => (SORTERS[sort.key](a, b) || SORTERS.task(a, b)) * (sort.dir === 'asc' ? 1 : -1))

  const workload = workloadFor(scope === 'project' ? [project] : STATS_PROJECTS)

  // A new project starts with a clean task view.
  function selectProject(id) {
    setProjectId(id)
    setStatusFilter('all')
    setQuery('')
  }

  function toggleSort(key) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  // Summary "Blocked" tile: open the project with the most blocked tasks,
  // filtered to them, and scroll the task list into view.
  function showBlocked() {
    const worst = ROWS.reduce((best, row) => (row.summary.counts.blocked > best.summary.counts.blocked ? row : best))
    setProjectId(worst.project.id)
    setStatusFilter('blocked')
    setQuery('')
    tasksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="statistics-page">
      <header className="st-header">
        <div>
          <h1>Project statistics</h1>
          <p>Progress, task status and team workload</p>
        </div>
        <label className="st-select">
          <span>Project</span>
          <select value={projectId} onChange={(event) => selectProject(event.target.value)}>
            {STATS_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </header>

      <p className="st-banner" role="note">
        <strong>Demo data.</strong> These projects, tasks and people are made-up samples. Nothing here is calculated from your real projects.
      </p>

      <SummaryMetrics activeProjects={ACTIVE_PROJECTS} totalProjects={STATS_PROJECTS.length} summary={PORTFOLIO} onShowBlocked={showBlocked} />

      <ProjectOverview rows={ROWS} selectedId={projectId} onSelect={selectProject} />

      <ProjectDetail project={project} summary={summary} statusFilter={statusFilter} onFilterStatus={setStatusFilter} />

      <TaskTable
        tasks={visibleTasks}
        allCount={project.tasks.length}
        members={project.members}
        statusCounts={summary.counts}
        statusFilter={statusFilter}
        onFilterStatus={setStatusFilter}
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={toggleSort}
        anchorRef={tasksRef}
      />

      <WorkloadPanel workload={workload} scope={scope} onScope={setScope} projectName={project.name} />
    </div>
  )
}

export default Statistics
