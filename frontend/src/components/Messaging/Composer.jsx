import { useRef, useState } from 'react'

const EMOJIS = ['😀', '😂', '👍', '🎉', '🙏', '👀', '✅', '🚀']

// Message box. Enter sends, Shift+Enter adds a line. Sending only adds the
// message to this page's local state; nothing is delivered or stored.
function Composer({ conversation, draft, replyTo, replyAuthor, onDraftChange, onCancelReply, onSend }) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const inputRef = useRef(null)
  const canSend = draft.trim().length > 0
  const label = conversation.kind === 'dm' ? conversation.name : `#${conversation.name}`

  function resize() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  function submit() {
    if (!canSend) return
    onSend(draft.trim())
    setEmojiOpen(false)
    // Collapse the box back to one line after the draft clears.
    requestAnimationFrame(resize)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') {
      setEmojiOpen(false)
      if (replyTo) onCancelReply()
    }
  }

  function addEmoji(emoji) {
    onDraftChange(draft + emoji)
    setEmojiOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="msg-composer">
      {replyTo && (
        <div className="msg-replying">
          <span>Replying to <strong>{replyAuthor.name}</strong></span>
          <button type="button" aria-label="Cancel reply" onClick={onCancelReply}>✕</button>
        </div>
      )}
      <div className="msg-composer-row">
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder={`Message ${label}`}
          aria-label={`Message ${label}`}
          onChange={(event) => {
            onDraftChange(event.target.value)
            resize()
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="msg-composer-tools">
          <div className="msg-emoji-wrap">
            <button type="button" className="msg-icon-btn" aria-label="Insert emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((v) => !v)}>☺</button>
            {emojiOpen && (
              <div className="msg-emoji-pop" role="menu">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" role="menuitem" onClick={() => addEmoji(emoji)}>{emoji}</button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="msg-send" disabled={!canSend} onClick={submit}>Send</button>
        </div>
      </div>
      <p className="msg-composer-note">Prototype: messages stay in this tab only and are not delivered or saved.</p>
    </div>
  )
}

export default Composer
