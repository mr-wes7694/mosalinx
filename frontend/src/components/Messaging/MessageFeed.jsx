import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem.jsx'
import { dayKey, formatDay } from './format.js'

// Consecutive messages from one person within this window collapse together.
const GROUP_WINDOW_MS = 7 * 60 * 1000

function MessageFeed({ conversation, messages, allMessages, members, query, onReact, onPin, onReply }) {
  const scrollRef = useRef(null)
  const memberOf = (id) => members.find((m) => m.id === id) ?? { id, name: 'Unknown', color: '#777', status: 'offline' }

  // Keep the newest message in view when switching or sending.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversation.id, allMessages.length])

  if (allMessages.length === 0) {
    return (
      <div className="msg-feed msg-feed--empty">
        <div className="msg-empty">
          <span className="msg-empty-icon" aria-hidden="true">{conversation.kind === 'dm' ? '✉' : '#'}</span>
          <h3>{conversation.kind === 'dm' ? `No messages with ${conversation.name} yet` : `Nothing in #${conversation.name} yet`}</h3>
          <p>This is sample data with no history here. Write the first message below to try the composer.</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="msg-feed msg-feed--empty">
        <div className="msg-empty">
          <span className="msg-empty-icon" aria-hidden="true">⌕</span>
          <h3>No messages match “{query}”</h3>
          <p>Try a different word, or clear the search.</p>
        </div>
      </div>
    )
  }

  const rows = []
  messages.forEach((message, index) => {
    const prev = messages[index - 1]
    const newDay = !prev || dayKey(prev.at) !== dayKey(message.at)
    if (newDay) {
      rows.push(
        <li key={`day-${message.id}`} className="msg-day" role="separator">
          <span>{formatDay(message.at)}</span>
        </li>
      )
    }
    const compact =
      !newDay &&
      prev.author === message.author &&
      !message.replyTo &&
      new Date(message.at) - new Date(prev.at) < GROUP_WINDOW_MS
    const replyTarget = message.replyTo ? allMessages.find((m) => m.id === message.replyTo) : null
    rows.push(
      <MessageItem
        key={message.id}
        message={message}
        author={memberOf(message.author)}
        replyTarget={replyTarget}
        replyAuthor={replyTarget ? memberOf(replyTarget.author) : null}
        compact={compact}
        onReact={onReact}
        onPin={onPin}
        onReply={onReply}
      />
    )
  })

  return (
    <div className="msg-feed" ref={scrollRef}>
      <ul className="msg-feed-list" aria-label={`Messages in ${conversation.name}`}>{rows}</ul>
    </div>
  )
}

export default MessageFeed
