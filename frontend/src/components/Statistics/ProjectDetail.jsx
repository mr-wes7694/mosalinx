import { GraphBody } from '../DashboardTile/DashboardTile.jsx'
import { PRIORITIES, STATUSES, PROJECT_STATUS_LABELS, countByPriority, weeklyCompletedSource } from '../../data/statisticsSampleData.js'

// Detailed numbers for the selected project: headline figures, status mix,
// weekly completions and priority mix. The weekly chart reuses the
// dashboard's graph tile body inside a card styled like a pinned note.
function ProjectDetail({ project, summary, statusFilter, onFilterStatus }) {
  const { counts, total } = summary
  const priorityCounts = countByPriority(project.tasks)
  const maxPriority = Math.max(...Object.values(priorityCounts), 1)

  return (
    <section aria-labelledby="st-detail-title">
      <div className="st-detail-head">
        <h2 id="st-detail-title" className="st-section-title">{project.name}</h2>
        <span className={`st-badge st-badge--${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
      </div>
      <p className="st-detail-desc">{project.description}</p>

      <div className="st-facts">
        <div className="st-card st-fact"><span>Completion</span><strong>{summary.percent}%</strong></div>
        <div className="st-card st-fact"><span>Open tasks</span><strong>{summary.open}</strong></div>
        <div className="st-card st-fact"><span>Blocked</span><strong className={counts.blocked ? 'is-bad' : ''}>{counts.blocked}</strong></div>
        <div className="st-card st-fact"><span>Overdue</span><strong className={summary.overdue ? 'is-bad' : ''}>{summary.overdue}</strong></div>
        <div className="st-card st-fact"><span>Points done</span><strong>{summary.donePoints}<small> / {summary.points}</small></strong></div>
      </div>

      {total === 0 ? (
        <div className="st-card st-empty">
          <h3>No tasks in this project yet</h3>
          <p>Charts and the task list appear here once the project has work in it.</p>
        </div>
      ) : (
        <div className="st-charts">
          <div className="st-card">
            <h3 className="st-card-title">Status breakdown</h3>
            <div className="st-stack" role="img" aria-label={STATUSES.map((s) => `${s.label} ${counts[s.id]}`).join(', ')}>
              {STATUSES.filter((s) => counts[s.id] > 0).map((s) => (
                <span key={s.id} style={{ flex: counts[s.id], background: s.color }} title={`${s.label}: ${counts[s.id]}`} />
              ))}
            </div>
            <ul className="st-legend">
              {STATUSES.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={statusFilter === s.id ? 'is-active' : ''}
                    aria-pressed={statusFilter === s.id}
                    title={`Show ${s.label.toLowerCase()} tasks`}
                    onClick={() => onFilterStatus(statusFilter === s.id ? 'all' : s.id)}
                  >
                    <span className="st-dot" style={{ background: s.color }} aria-hidden="true" />
                    {s.label}
                    <strong>{counts[s.id]}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="st-card st-card--paper st-graph">
            <GraphBody config={{ chart: 'bar' }} source={weeklyCompletedSource(project.tasks)} />
          </div>

          <div className="st-card">
            <h3 className="st-card-title">Priority</h3>
            <ul className="st-bars">
              {PRIORITIES.map((p) => (
                <li key={p.id}>
                  <span>{p.label}</span>
                  <span className="st-bar-track"><span style={{ width: `${(priorityCounts[p.id] / maxPriority) * 100}%`, background: p.color }} /></span>
                  <strong>{priorityCounts[p.id]}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProjectDetail
