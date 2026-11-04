import { STATUSES } from '../../data/statisticsSampleData.js'
import { Avatar, ProgressBar } from './StatBits.jsx'

const OPEN_STATUSES = STATUSES.filter((s) => s.id !== 'done')

// Open work per person against their sprint capacity (story points).
function WorkloadPanel({ workload, scope, onScope, projectName }) {
  const { people, unassigned } = workload
  const openTotal = people.reduce((sum, p) => sum + p.tasks, 0) + unassigned.tasks
  const empty = people.length === 0 && unassigned.tasks === 0

  return (
    <section aria-labelledby="st-workload-title">
      <div className="st-workload-head">
        <h2 id="st-workload-title" className="st-section-title">Team workload</h2>
        <div className="st-toggle" role="group" aria-label="Workload scope">
          <button type="button" className={scope === 'project' ? 'is-active' : ''} aria-pressed={scope === 'project'} onClick={() => onScope('project')}>This project</button>
          <button type="button" className={scope === 'all' ? 'is-active' : ''} aria-pressed={scope === 'all'} onClick={() => onScope('all')}>All projects</button>
        </div>
      </div>

      <div className="st-card st-workload">
        {empty ? (
          <p className="st-table-empty">{scope === 'project' ? `No one has been assigned work in ${projectName} yet.` : 'No assigned work yet.'}</p>
        ) : (
          <>
            <ul>
              {people.map(({ member, counts, tasks, points, done }) => {
                const percent = Math.round((points / member.capacity) * 100)
                const over = percent > 100
                return (
                  <li key={member.id} className="st-load-row">
                    <span className="st-load-who">
                      <Avatar member={member} size={30} />
                      <span>
                        <strong>{member.name}</strong>
                        <small>{member.role}</small>
                      </span>
                    </span>
                    <span className="st-load-meter">
                      <ProgressBar percent={Math.min(percent, 100)} color={over ? '#e5484d' : percent >= 80 ? '#d9a21b' : '#2b6f77'} label={`${member.name} workload`} />
                      <span className="st-load-numbers">
                        {points} / {member.capacity} pts · {percent}%
                        {over && <em>Over capacity</em>}
                      </span>
                    </span>
                    <span className="st-load-tasks">
                      <strong>{tasks}</strong> open
                      <span className="st-load-dots" aria-hidden="true">
                        {OPEN_STATUSES.map((s) => counts[s.id] > 0 && <span key={s.id} style={{ background: s.color }} title={`${s.label}: ${counts[s.id]}`}>{counts[s.id]}</span>)}
                      </span>
                      <small>{done} done</small>
                    </span>
                  </li>
                )
              })}
              {unassigned.tasks > 0 && (
                <li className="st-load-row st-load-row--unassigned">
                  <span className="st-load-who"><span className="st-avatar st-avatar--empty" aria-hidden="true">?</span><span><strong>Unassigned</strong><small>Needs an owner</small></span></span>
                  <span className="st-load-meter"><span className="st-load-numbers">{unassigned.points} pts waiting</span></span>
                  <span className="st-load-tasks"><strong>{unassigned.tasks}</strong> open</span>
                </li>
              )}
            </ul>
            <p className="st-load-total">{openTotal} open tasks in total · capacity is story points per sprint</p>
          </>
        )}
      </div>
    </section>
  )
}

export default WorkloadPanel
