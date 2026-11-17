import { useEffect, useState } from 'react'
import { useProject } from '../context/useProject'
import { useAuth } from '../hooks/useAuth.js'
import { listProjectMembers } from '../services/projectMemberService.js'
import { sendProjectInvitation } from '../services/invitationService.js'
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

  // Track the invitation form and submission feedback.
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [invitationStatus, setInvitationStatus] = useState({
    type: '',
    message: ''
  })
  const [sendingInvitation, setSendingInvitation] = useState(false)

  const projectId = activeProject?.project_id
  const requestKey = `${currentUser?.uid || 'signed-out'}-${projectId || 'none'}-${refreshCount}`

  // Send a project invitation to an existing Mosalinx user.
  const handleSendInvitation = async (event) => {
    event.preventDefault();

    const email = inviteeEmail.trim();

    if (
      !email ||
      !activeProject?.project_id ||
      !currentUser ||
      sendingInvitation
    ) {
      return;
    }

    setSendingInvitation(true);
    setInvitationStatus({ type: '', message: '' });

    try {
      await sendProjectInvitation(
        currentUser,
        activeProject.project_id,
        email
      );

      setInviteeEmail('');
      setInvitationStatus({
        type: 'success',
        message: `Invitation sent successfully to ${email}.`
      });
    } catch (error) {
      setInvitationStatus({
        type: 'error',
        message: error.message || 'Failed to send invitation.'
      });
    } finally {
      setSendingInvitation(false);
    }
  };

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

      {activeProject.role === 'owner' && (
        <form
          className="team-members-invite-form"
          onSubmit={handleSendInvitation}
        >
          <h2>Invite Collaborator</h2>
          <p>
            Invite an existing Mosalinx user to collaborate on this project.
          </p>

          <div className="team-members-invite-controls">
            <input
              type="email"
              value={inviteeEmail}
              onChange={(event) => {
                setInviteeEmail(event.target.value);
                setInvitationStatus({ type: '', message: '' });
              }}
              placeholder="Enter collaborator's email"
              aria-label="Collaborator email address"
              required
              disabled={sendingInvitation}
            />

            <button
              type="submit"
              disabled={sendingInvitation || !inviteeEmail.trim()}
            >
              {sendingInvitation ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>

          {invitationStatus.message && (
            <p
              className={`team-members-invite-${invitationStatus.type}`}
              role={invitationStatus.type === 'error' ? 'alert' : 'status'}
            >
              {invitationStatus.message}
            </p>
          )}
        </form>
      )}

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
