import { useEffect, useState } from 'react'
import { useProject } from '../context/useProject'
import { useAuth } from '../hooks/useAuth.js'
import { listProjectMembers } from '../services/projectMemberService.js'
import TeamMemberList from '../components/TeamMemberList'
import './TeamMembers.css'

// Display the members of the currently selected project.
function TeamMembers() {
  const { activeProject, loadingProjects, projectError } = useProject()
  const { currentUser, loading: authLoading } = useAuth()

  const [memberResult, setMemberResult] = useState({
    requestKey: null,
    members: [],
    error: ''
  })
  const [refreshCount, setRefreshCount] = useState(0)

  const projectId = activeProject?.project_id
  const requestKey = `${currentUser?.uid || 'signed-out'}-${projectId || 'none'}-${refreshCount}`

  // Load members whenever the user or selected project changes.
  useEffect(() => {
    if (authLoading || loadingProjects || !currentUser || !projectId) {
      return
    }

    let cancelled = false

    async function loadMembers() {
      try {
        const projectMembers = await listProjectMembers(
          currentUser,
          Number(projectId)
        )

        if (!cancelled) {
          setMemberResult({
            requestKey,
            members: projectMembers,
            error: ''
          })
        }
      } catch (error) {
        if (!cancelled) {
          setMemberResult({
            requestKey,
            members: [],
            error: error.message || 'Failed to load project members.'
          })
        }
      }
    }

    loadMembers()

    // Ignore responses from a previous project or authentication state.
    return () => {
      cancelled = true
    }
  }, [currentUser, authLoading, loadingProjects, projectId, requestKey])

  if (loadingProjects || authLoading) {
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

  const loadingMembers = Boolean(
    currentUser && memberResult.requestKey !== requestKey
  )

  const membersError = !currentUser
    ? 'You must be signed in to view project members.'
    : memberResult.requestKey === requestKey
      ? memberResult.error
      : ''

  const members = memberResult.requestKey === requestKey
    ? memberResult.members
    : []

  return (
    <section className="team-members-page">
      <header className="team-members-header">
        <div>
          <h1>Team Members</h1>
          <p className="team-members-project">
            {activeProject.project_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshCount((count) => count + 1)}
          disabled={loadingMembers || !currentUser}
        >
          {loadingMembers ? 'Refreshing...' : 'Refresh members'}
        </button>
      </header>

      <TeamMemberList
        members={members}
        user={currentUser}
        loading={loadingMembers}
        error={membersError}
      />
    </section>
  )
}

export default TeamMembers
