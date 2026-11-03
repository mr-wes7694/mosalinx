import { useRef, useState } from 'react'
import { SAMPLE_PROJECTS } from '../data/messagingSampleData.js'
import ProjectRail from '../components/Messaging/ProjectRail.jsx'
import ConversationList from '../components/Messaging/ConversationList.jsx'
import MessageFeed from '../components/Messaging/MessageFeed.jsx'
import Composer from '../components/Messaging/Composer.jsx'
import SidePanel from '../components/Messaging/SidePanel.jsx'
import './Messages.css'

// Prototype messaging page. Every project is its own space with its own
// conversations. All data is local sample data held in React state, so
// nothing is sent, stored or shared. A future backend can replace
// SAMPLE_PROJECTS and the handlers below without changing the components.

const firstConversationId = (project) => project.conversations[0]?.id ?? null

function Messages() {
  const [projectId, setProjectId] = useState(SAMPLE_PROJECTS[0].id)
  // Remember the open conversation per project so switching back returns to it.
  const [activeByProject, setActiveByProject] = useState(() =>
    Object.fromEntries(SAMPLE_PROJECTS.map((p) => [p.id, firstConversationId(p)]))
  )
  // Messages are kept per conversation id, so projects can never mix.
  const [messagesByConvo, setMessagesByConvo] = useState(() =>
    Object.fromEntries(SAMPLE_PROJECTS.flatMap((p) => p.conversations.map((c) => [c.id, c.messages])))
  )
  const [readIds, setReadIds] = useState(() => new Set([firstConversationId(SAMPLE_PROJECTS[0])]))
  const [drafts, setDrafts] = useState({})
  const [replyToId, setReplyToId] = useState(null)
  const [panel, setPanel] = useState(null) // null | 'members' | 'pins'
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [bannerHidden, setBannerHidden] = useState(false)
  const sentCount = useRef(0)

  // Sample projects with live unread counts attached.
  const projects = SAMPLE_PROJECTS.map((project) => ({
    ...project,
    conversations: project.conversations.map((convo) => ({
      ...convo,
      unreadNow: readIds.has(convo.id) ? 0 : convo.unread,
    })),
  }))
  const project = projects.find((p) => p.id === projectId)
  const conversation = project.conversations.find((c) => c.id === activeByProject[projectId]) ?? null
  const messages = conversation ? messagesByConvo[conversation.id] : []
  const needle = query.trim().toLowerCase()
  const shownMessages = needle ? messages.filter((m) => m.text.toLowerCase().includes(needle)) : messages
  const memberOf = (id) => project.members.find((m) => m.id === id) ?? { id, name: 'Unknown', color: '#777', status: 'offline' }
  const replyTarget = replyToId ? messages.find((m) => m.id === replyToId) : null

  function markRead(id) {
    if (id) setReadIds((prev) => new Set(prev).add(id))
  }

  // Context that belongs to one conversation resets when the view changes.
  function resetConversationUi() {
    setReplyToId(null)
    setQuery('')
    setSearchOpen(false)
    setNavOpen(false)
  }

  function selectProject(id) {
    if (id === projectId) return
    setProjectId(id)
    markRead(activeByProject[id])
    resetConversationUi()
  }

  function selectConversation(id) {
    setActiveByProject((prev) => ({ ...prev, [projectId]: id }))
    markRead(id)
    resetConversationUi()
  }

  function updateMessage(id, change) {
    setMessagesByConvo((prev) => ({
      ...prev,
      [conversation.id]: prev[conversation.id].map((m) => (m.id === id ? change(m) : m)),
    }))
  }

  function toggleReaction(id, emoji) {
    updateMessage(id, (m) => {
      const existing = m.reactions.find((r) => r.emoji === emoji)
      let reactions
      if (!existing) reactions = [...m.reactions, { emoji, count: 1, mine: true }]
      else if (existing.mine) reactions = m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r)).filter((r) => r.count > 0)
      else reactions = m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r))
      return { ...m, reactions }
    })
  }

  function togglePin(id) {
    updateMessage(id, (m) => ({ ...m, pinned: !m.pinned }))
  }

  function sendMessage(text) {
    sentCount.current += 1
    const message = {
      id: `local-${sentCount.current}`,
      author: 'me',
      at: new Date().toISOString(),
      text,
      replyTo: replyToId ?? undefined,
      reactions: [],
      demo: true, // flagged so the UI never implies real delivery
    }
    setMessagesByConvo((prev) => ({ ...prev, [conversation.id]: [...prev[conversation.id], message] }))
    setDrafts((prev) => ({ ...prev, [conversation.id]: '' }))
    setReplyToId(null)
    // A search that hides the new message would look like it failed to send.
    setQuery('')
  }

  function togglePanel(mode) {
    setPanel((current) => (current === mode ? null : mode))
  }

  const channelLabel = conversation ? (conversation.kind === 'dm' ? conversation.name : `# ${conversation.name}`) : project.name

  return (
    <div className="messages-page">
      <ProjectRail projects={projects} activeId={projectId} onSelect={selectProject} />

      <div className={`msg-list-wrap${navOpen ? ' is-open' : ''}`}>
        <ConversationList
          key={projectId}
          project={project}
          activeId={conversation?.id}
          onSelect={selectConversation}
          onClose={() => setNavOpen(false)}
        />
        <button type="button" className="msg-backdrop" aria-label="Close conversation list" tabIndex={-1} onClick={() => setNavOpen(false)} />
      </div>

      <section className="msg-chat" aria-label="Conversation">
        <header className="msg-chat-head">
          <button type="button" className="msg-icon-btn msg-only-narrow" aria-label="Open conversation list" onClick={() => setNavOpen(true)}>☰</button>
          <div className="msg-chat-title">
            <h2>{channelLabel}</h2>
            {conversation && <p>{conversation.topic}</p>}
          </div>
          {conversation && (
            <div className="msg-chat-tools">
              <button type="button" className={`msg-icon-btn${searchOpen ? ' is-on' : ''}`} aria-label="Search this conversation" aria-pressed={searchOpen} title="Search" onClick={() => { setSearchOpen((v) => !v); setQuery('') }}>⌕</button>
              <button type="button" className={`msg-icon-btn${panel === 'pins' ? ' is-on' : ''}`} aria-label="Pinned messages" aria-pressed={panel === 'pins'} title="Pinned messages" onClick={() => togglePanel('pins')}>📌</button>
              <button type="button" className={`msg-icon-btn${panel === 'members' ? ' is-on' : ''}`} aria-label="Members" aria-pressed={panel === 'members'} title="Members" onClick={() => togglePanel('members')}>👥</button>
            </div>
          )}
        </header>

        {!bannerHidden && (
          <div className="msg-banner" role="note">
            <span><strong>Demo content.</strong> People and messages are made-up samples, and nothing you send is delivered or saved.</span>
            <button type="button" aria-label="Dismiss notice" onClick={() => setBannerHidden(true)}>✕</button>
          </div>
        )}

        {searchOpen && (
          <div className="msg-search">
            <input
              type="search"
              autoFocus
              value={query}
              placeholder={`Search ${channelLabel}`}
              aria-label="Search messages"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Escape' && (setSearchOpen(false), setQuery(''))}
            />
            {needle && <span>{shownMessages.length} found</span>}
          </div>
        )}

        {conversation ? (
          <MessageFeed
            conversation={conversation}
            messages={shownMessages}
            allMessages={messages}
            members={project.members}
            query={query}
            onReact={toggleReaction}
            onPin={togglePin}
            onReply={setReplyToId}
          />
        ) : (
          <div className="msg-feed msg-feed--empty">
            <div className="msg-empty">
              <span className="msg-empty-icon" aria-hidden="true">💬</span>
              <h3>No conversations in this project</h3>
              <p>This sample project has no channels yet. Pick another project from the left.</p>
            </div>
          </div>
        )}

        {conversation && (
          <Composer
            key={conversation.id}
            conversation={conversation}
            draft={drafts[conversation.id] ?? ''}
            replyTo={replyTarget}
            replyAuthor={replyTarget ? memberOf(replyTarget.author) : null}
            onDraftChange={(text) => setDrafts((prev) => ({ ...prev, [conversation.id]: text }))}
            onCancelReply={() => setReplyToId(null)}
            onSend={sendMessage}
          />
        )}
      </section>

      {conversation && panel && (
        <SidePanel
          mode={panel}
          members={project.members}
          pinned={messages.filter((m) => m.pinned)}
          memberOf={memberOf}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  )
}

export default Messages
