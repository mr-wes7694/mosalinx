// Portfolio-wide headline numbers. The Blocked tile is a button that jumps
// to the blocked tasks; the rest are read-only.
function Metric({ label, value, note, tone, onClick, hint }) {
  const content = (
    <>
      <span className="st-metric-label">{label}</span>
      <strong className="st-metric-value">{value}</strong>
      <span className="st-metric-note">{note}</span>
    </>
  )
  const className = `st-card st-metric${tone ? ` st-metric--${tone}` : ''}`
  if (onClick) {
    return (
      <button type="button" className={`${className} is-button`} onClick={onClick} title={hint}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

function SummaryMetrics({ activeProjects, totalProjects, summary, onShowBlocked }) {
  return (
    <section className="st-metrics" aria-label="Summary across all sample projects">
      <Metric label="Active projects" value={activeProjects} note={`of ${totalProjects} projects`} />
      <Metric label="Total tasks" value={summary.total} note={`${summary.open} still open`} />
      <Metric label="Completed" value={`${summary.percent}%`} note={`${summary.counts.done} of ${summary.total} tasks`} tone="done" />
      <Metric label="In progress" value={summary.counts.in_progress} note={`${summary.counts.in_review} more in review`} />
      <Metric
        label="Blocked"
        value={summary.counts.blocked}
        note={summary.counts.blocked ? 'Click to review' : 'Nothing blocked'}
        tone={summary.counts.blocked ? 'blocked' : undefined}
        onClick={summary.counts.blocked ? onShowBlocked : undefined}
        hint="Show the blocked tasks"
      />
    </section>
  )
}

export default SummaryMetrics
