import { PROJECT_STATUS_LABELS } from '../../data/statisticsSampleData.js'
import { Avatar, ProgressBar } from './StatBits.jsx'

// One selectable card per project: progress, task counts and blockers.
function ProjectOverview({ rows, selectedId, onSelect }) {
  return (
    <section aria-labelledby="st-overview-title">
      <h2 id="st-overview-title" className="st-section-title">Project overview</h2>
      <ul className="st-overview">
        {rows.map(({ project, summary }) => {
          const selected = project.id === selectedId
          return (
            <li key={project.id}>
              <button
                type="button"
                className={`st-card st-project${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelect(project.id)}
              >
                <span className="st-project-head">
                  <span className="st-dot" style={{ background: project.color }} aria-hidden="true" />
                  <strong>{project.name}</strong>
                  <span className={`st-badge st-badge--${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
                </span>

                {summary.total === 0 ? (
                  <span className="st-project-empty">No tasks yet</span>
                ) : (
                  <>
                    <ProgressBar percent={summary.percent} color="#2e9e6b" label={`${project.name} completion`} />
                    <span className="st-project-stats">
                      <span><strong>{summary.percent}%</strong> done</span>
                      <span>{summary.counts.done}/{summary.total} tasks</span>
                      {summary.counts.blocked > 0 && <span className="st-project-blocked">{summary.counts.blocked} blocked</span>}
                    </span>
                  </>
                )}

                <span className="st-avatars" aria-label={`${project.members.length} members`}>
                  {project.members.slice(0, 5).map((member) => <Avatar key={member.id} member={member} size={24} />)}
                  {project.members.length > 5 && <span className="st-avatars-more">+{project.members.length - 5}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ProjectOverview
