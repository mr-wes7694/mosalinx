import Avatar from './Avatar.jsx'
import { formatDay, formatTime } from './format.js'

// Right-hand panel: either the project's members or the pinned messages of
// the open conversation.
function SidePanel({ mode, members, pinned, onClose, memberOf }) {
  const title = mode === 'members' ? `Members — ${members.length}` : `Pinned — ${pinned.length}`
  return (
    <aside className="msg-side" aria-label={mode === 'members' ? 'Members' : 'Pinned messages'}>
      <header>
        <h3>{title}</h3>
        <button type="button" className="msg-icon-btn" aria-label="Close panel" onClick={onClose}>✕</button>
      </header>

      {mode === 'members' && (
        <ul className="msg-members">
          {members.map((member) => (
            <li key={member.id}>
              <Avatar member={member} size={32} showStatus />
              <span>
                <strong>{member.name}</strong>
                <small>{member.role}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {mode === 'pins' && (pinned.length === 0 ? (
        <p className="msg-side-empty">No pinned messages here. Hover a message and use the pin button.</p>
      ) : (
        <ul className="msg-pins">
          {pinned.map((message) => (
            <li key={message.id}>
              <p><strong>{memberOf(message.author).name}</strong> · {formatDay(message.at)}, {formatTime(message.at)}</p>
              <p>{message.text}</p>
            </li>
          ))}
        </ul>
      ))}
    </aside>
  )
}

export default SidePanel
