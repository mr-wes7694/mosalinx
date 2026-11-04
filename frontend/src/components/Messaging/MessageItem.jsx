import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { formatTime } from './format.js'

const QUICK_REACTIONS = ['👍', '🎉', '👀', '✅', '❤️']

// Highlights @mentions; everything else renders as plain text (no innerHTML).
function renderText(text) {
  return text.split(/(@\w+)/g).map((part, index) =>
    part.startsWith('@') ? (
      <span key={index} className="msg-mention">{part}</span>
    ) : (
      part
    )
  )
}

function MessageItem({ message, author, replyTarget, replyAuthor, compact, onReact, onPin, onReply }) {
  const [picking, setPicking] = useState(false)

  function handleKeyDown(event) {
    if (event.key === 'Escape') setPicking(false)
  }

  return (
    <li className={`msg-item${compact ? ' is-compact' : ''}${message.pinned ? ' is-pinned' : ''}`} onKeyDown={handleKeyDown}>
      <div className="msg-item-gutter">
        {compact ? <time className="msg-hover-time" dateTime={message.at}>{formatTime(message.at)}</time> : <Avatar member={author} />}
      </div>

      <div className="msg-item-body">
        {replyTarget && (
          <p className="msg-quote">
            <span>↪ {replyAuthor.name}</span> {replyTarget.text}
          </p>
        )}
        {!compact && (
          <p className="msg-item-meta">
            <strong style={{ color: author.color }}>{author.name}</strong>
            <time dateTime={message.at}>{formatTime(message.at)}</time>
            {message.pinned && <span className="msg-pin-flag">📌 Pinned</span>}
            {message.demo && (
              <span className="msg-demo-flag" title="Prototype only: this message was not delivered or saved and disappears on refresh.">
                Demo · not sent
              </span>
            )}
          </p>
        )}
        <p className="msg-text">
          {renderText(message.text)}
          {compact && message.demo && <span className="msg-demo-flag" title="Prototype only: not delivered or saved.">Demo · not sent</span>}
        </p>

        {message.reactions.length > 0 && (
          <ul className="msg-reactions" aria-label="Reactions">
            {message.reactions.map((reaction) => (
              <li key={reaction.emoji}>
                <button
                  type="button"
                  className={reaction.mine ? 'is-mine' : ''}
                  aria-pressed={reaction.mine}
                  aria-label={`${reaction.emoji} ${reaction.count}`}
                  onClick={() => onReact(message.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`msg-actions${picking ? ' is-open' : ''}`} role="toolbar" aria-label="Message actions">
        {picking ? (
          QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={() => {
                onReact(message.id, emoji)
                setPicking(false)
              }}
            >
              {emoji}
            </button>
          ))
        ) : (
          <>
            <button type="button" aria-label="Add reaction" title="Add reaction" onClick={() => setPicking(true)}>☺</button>
            <button type="button" aria-label="Reply" title="Reply" onClick={() => onReply(message.id)}>↩</button>
            <button type="button" aria-label={message.pinned ? 'Unpin message' : 'Pin message'} title={message.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(message.id)}>📌</button>
          </>
        )}
      </div>
    </li>
  )
}

export default MessageItem
