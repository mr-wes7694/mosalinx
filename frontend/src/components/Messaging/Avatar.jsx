// Round initials badge with an optional presence dot.
function initials(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({ member, size = 36, showStatus = false }) {
  return (
    <span className="msg-avatar" style={{ width: size, height: size, background: member.color, fontSize: size * 0.4 }} aria-hidden="true">
      {initials(member.name)}
      {showStatus && <span className={`msg-status msg-status--${member.status}`} />}
    </span>
  )
}

export default Avatar
