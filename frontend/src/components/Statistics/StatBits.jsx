import { PRIORITIES, STATUSES } from '../../data/statisticsSampleData.js'

// Small shared pieces used across the Statistics sections.

export function Avatar({ member, size = 28 }) {
  const initials = member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="st-avatar" style={{ width: size, height: size, background: member.color, fontSize: size * 0.4 }} aria-hidden="true">
      {initials}
    </span>
  )
}

export function StatusPill({ status }) {
  const info = STATUSES.find((s) => s.id === status)
  return (
    <span className="st-pill" style={{ '--pill': info.color }}>
      {info.label}
    </span>
  )
}

// Arrow glyph plus label, so priority never relies on color alone.
export function PriorityTag({ priority }) {
  const info = PRIORITIES.find((p) => p.id === priority)
  const arrow = info.rank <= 1 ? '▲' : info.rank === 2 ? '■' : '▼'
  return (
    <span className="st-priority" style={{ color: info.color }}>
      <span aria-hidden="true">{arrow}</span> {info.label}
    </span>
  )
}

export function ProgressBar({ percent, color, label }) {
  return (
    <div className="st-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={label}>
      <span style={{ width: `${percent}%`, background: color }} />
    </div>
  )
}
