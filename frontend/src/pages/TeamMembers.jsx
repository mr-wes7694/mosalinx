import { useProject } from '../context/useProject'
import TeamMemberList from '../components/TeamMemberList'
import './TeamMembers.css'

// Display the member list for the currently selected project.
function TeamMembers() {
  const { activeProject, loadingProjects, projectError } = useProject()

  if (loadingProjects) {
    return (
      <section className="team-members-page">
        <p role="status">Loading project...</p>
      </section>
    )
  }

  if (projectError && !activeProject) {
    return (
      <section className="team-members-page">
        <p role="alert">{projectError}</p>
      </section>
    )
  }

  if (!activeProject) {
    return (
      <section className="team-members-page">
        <h1>Team Members</h1>
        <p>Select or create a project to view its members.</p>
      </section>
    )
  }

  return (
    <section className="team-members-page">
      <header className="team-members-header">
        <div>
          <h1>Team Members</h1>
          <p className="team-members-project">
            {activeProject.project_name}
          </p>
        </div>
      </header>

      <TeamMemberList />
    </section>
  )
}

export default TeamMembers
