// Narrow column of project icons, like the server list in Discord.
function ProjectRail({ projects, activeId, onSelect }) {
  return (
    <nav className="msg-rail" aria-label="Projects">
      {projects.map((project) => {
        const unread = project.conversations.reduce((sum, convo) => sum + convo.unreadNow, 0)
        const active = project.id === activeId
        return (
          <button
            key={project.id}
            type="button"
            className={`msg-rail-btn${active ? ' is-active' : ''}`}
            style={{ '--project-color': project.color }}
            aria-label={`${project.name}${unread ? `, ${unread} unread` : ''}`}
            aria-current={active ? 'true' : undefined}
            title={project.name}
            onClick={() => onSelect(project.id)}
          >
            {project.short}
            {unread > 0 && <span className="msg-rail-badge">{unread}</span>}
          </button>
        )
      })}
    </nav>
  )
}

export default ProjectRail
