import { STATUSES, isOverdue } from '../../data/statisticsSampleData.js'
import { Avatar, PriorityTag, ProgressBar, StatusPill } from './StatBits.jsx'

const COLUMNS = [
  { key: 'task', label: 'Task' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'progress', label: 'Progress', narrowHide: true },
  { key: 'due', label: 'Due', narrowHide: true },
]

function formatDue(task) {
  if (task.status === 'done') return 'Completed'
  const date = new Date()
  date.setDate(date.getDate() + task.dueIn)
  const label = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return task.dueIn === 0 ? 'Today' : label
}

// Sort + filter happen in the page; this component only renders. Header
// buttons change the sort, and the chips above change the status filter.
function TaskTable({ tasks, allCount, members, statusCounts, statusFilter, onFilterStatus, query, onQuery, sort, onSort, anchorRef }) {
  const memberOf = (id) => members.find((m) => m.id === id)

  return (
    <section aria-labelledby="st-tasks-title" ref={anchorRef} className="st-anchor">
      <h2 id="st-tasks-title" className="st-section-title">Tasks</h2>
      <div className="st-card st-tasks">
        <div className="st-tasks-bar">
          <div className="st-chips" role="group" aria-label="Filter by status">
            <button type="button" className={statusFilter === 'all' ? 'is-active' : ''} aria-pressed={statusFilter === 'all'} onClick={() => onFilterStatus('all')}>
              All <span>{allCount}</span>
            </button>
            {STATUSES.map((s) => (
              <button key={s.id} type="button" className={statusFilter === s.id ? 'is-active' : ''} aria-pressed={statusFilter === s.id} onClick={() => onFilterStatus(s.id)}>
                {s.label} <span>{statusCounts[s.id]}</span>
              </button>
            ))}
          </div>
          <input
            type="search"
            className="st-search"
            value={query}
            placeholder="Search tasks"
            aria-label="Search tasks"
            onChange={(event) => onQuery(event.target.value)}
          />
        </div>

        {allCount === 0 ? (
          <p className="st-table-empty">This project has no tasks yet.</p>
        ) : tasks.length === 0 ? (
          <p className="st-table-empty">
            No tasks match these filters.{' '}
            <button type="button" className="st-link" onClick={() => { onFilterStatus('all'); onQuery('') }}>Clear filters</button>
          </p>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  {COLUMNS.map((column) => {
                    const active = sort.key === column.key
                    return (
                      <th
                        key={column.key}
                        scope="col"
                        className={column.narrowHide ? 'st-narrow-hide' : ''}
                        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button type="button" className={`st-sort${active ? ' is-active' : ''}`} onClick={() => onSort(column.key)}>
                          {column.label}
                          <span aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const assignee = task.assignee ? memberOf(task.assignee) : null
                  const overdue = isOverdue(task)
                  return (
                    <tr key={task.key} className={task.status === 'blocked' ? 'is-blocked' : ''}>
                      <td>
                        <span className="st-task-key">{task.key}</span>
                        <span className="st-task-title">{task.title}</span>
                        {task.blockedReason && <span className="st-task-reason">⚠ {task.blockedReason}</span>}
                      </td>
                      <td><StatusPill status={task.status} /></td>
                      <td><PriorityTag priority={task.priority} /></td>
                      <td>
                        {assignee ? (
                          <span className="st-assignee"><Avatar member={assignee} size={24} />{assignee.name}</span>
                        ) : (
                          <span className="st-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td className="st-narrow-hide">
                        <span className="st-progress-cell">
                          <ProgressBar percent={task.progress} color={task.status === 'blocked' ? '#e5484d' : '#2b6f77'} label={`${task.key} progress`} />
                          <span>{task.progress}%</span>
                        </span>
                      </td>
                      <td className={`st-narrow-hide${overdue ? ' is-overdue' : ''}`}>
                        {formatDue(task)}
                        {overdue && <span className="st-overdue-tag">Overdue</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default TaskTable
