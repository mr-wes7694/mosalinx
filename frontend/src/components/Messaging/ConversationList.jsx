import { useState } from 'react'
import Avatar from './Avatar.jsx'

// Channels and direct messages for the selected project, with a filter box
// and collapsible sections.
function Section({ title, items, activeId, onSelect, members, query }) {
  const [open, setOpen] = useState(true)
  if (items.length === 0) return null
  return (
    <section className="msg-section">
      <button type="button" className="msg-section-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={open ? '' : 'is-collapsed'}>
          <path d="m6 9 6 6 6-6" />
        </svg>
        {title}
      </button>
      {(open || query) && (
        <ul>
          {items.map((convo) => {
            const peer = convo.kind === 'dm' ? members.find((m) => m.id === convo.peer) : null
            return (
              <li key={convo.id}>
                <button
                  type="button"
                  className={`msg-convo${convo.id === activeId ? ' is-active' : ''}${convo.unreadNow ? ' is-unread' : ''}`}
                  aria-current={convo.id === activeId ? 'true' : undefined}
                  onClick={() => onSelect(convo.id)}
                >
                  {peer ? <Avatar member={peer} size={22} showStatus /> : <span className="msg-hash" aria-hidden="true">#</span>}
                  <span className="msg-convo-name">{convo.name}</span>
                  {convo.unreadNow > 0 && <span className="msg-count">{convo.unreadNow}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ConversationList({ project, activeId, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = project.conversations.filter((convo) => convo.name.toLowerCase().includes(needle))

  return (
    <aside className="msg-list" aria-label={`${project.name} conversations`}>
      <header className="msg-list-head">
        <div>
          <h2>{project.name}</h2>
          <p>{project.members.length} members · demo data</p>
        </div>
        {/* Only shown when the list is a slide-over on narrow screens. */}
        <button type="button" className="msg-icon-btn msg-only-narrow" aria-label="Close conversation list" onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="msg-list-search">
        <input
          type="search"
          value={query}
          placeholder="Find a conversation"
          aria-label="Find a conversation"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="msg-list-scroll">
        {project.conversations.length === 0 && (
          <p className="msg-list-empty">This project has no conversations yet.</p>
        )}
        {project.conversations.length > 0 && visible.length === 0 && (
          <p className="msg-list-empty">No conversations match “{query}”.</p>
        )}
        <Section title="Channels" items={visible.filter((c) => c.kind === 'channel')} activeId={activeId} onSelect={onSelect} members={project.members} query={needle} />
        <Section title="Direct messages" items={visible.filter((c) => c.kind === 'dm')} activeId={activeId} onSelect={onSelect} members={project.members} query={needle} />
      </div>
    </aside>
  )
}

export default ConversationList
