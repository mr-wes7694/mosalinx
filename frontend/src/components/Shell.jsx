import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import './Shell.css'
import Sidebar from './Sidebar.jsx'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { logoutUser } from '../services/authService'
import {
  listPendingInvitations,
  acceptProjectInvitation
} from '../services/invitationService.js'
import { ProjectProvider } from '../context/ProjectContext.jsx'
import { useProject } from '../context/useProject.js'
import logo from '../assets/Mosalinx_logo_min_ver2_horizontal.svg'

const APP_NAMES = {
  '/dashboard': 'Bulletin Board',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/messages': 'Messages',
  '/dashboard/statistics': 'Statistics',
  '/dashboard/resources': 'Resources',
  '/dashboard/workspace': 'Workspace',
  '/dashboard/team-members': 'Team Members',
}

// Refresh accessible projects after an invitation is accepted.
function InvitationProjectRefresh({ refreshSignal }) {
  const { refreshProjects } = useProject()

  useEffect(() => {
    if (refreshSignal === 0) return

    refreshProjects().catch((error) => {
      console.error('Failed to refresh projects after invitation:', error)
    })
  }, [refreshSignal, refreshProjects])

  return null
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { currentUser, userProfile } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // Track invitations and their acceptance status.
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [invitationsOpen, setInvitationsOpen] = useState(false)
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [acceptingInvitationId, setAcceptingInvitationId] = useState(null)
  const [invitationRefreshSignal, setInvitationRefreshSignal] = useState(0)
  const [invitationError, setInvitationError] = useState('')

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Display the user's persisted profile name in the account menu.
  const displayName = userProfile?.displayName ?? ''
  const [firstName, ...lastNameParts] = displayName.trim().split(/\s+/)
  const lastName = lastNameParts.join(' ')

  const sidebarPosition = 'left'
  const location = useLocation()
  const navigate = useNavigate()
  const currentAppName = APP_NAMES[location.pathname] ?? 'Mosalinx'

  // Keep Workspace within the viewport so its editor can scroll independently.
  const isWorkspace = location.pathname === '/dashboard/workspace'

  // Retrieve pending invitations for the signed-in user.
  const loadPendingInvitations = async () => {
    if (!currentUser) {
      setPendingInvitations([]);
      return;
    }

    setLoadingInvitations(true);
    setInvitationError('');

    try {
      const invitations = await listPendingInvitations(currentUser);
      setPendingInvitations(invitations);
    } catch (error) {
      setInvitationError(
        error.message || 'Failed to load invitations.'
      );
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Check for pending invitations when the signed-in user changes.
  useEffect(() => {
    if (!currentUser) return;

    let active = true;

    const checkInvitations = async () => {
      try {
        const invitations = await listPendingInvitations(currentUser);

        if (active) {
          setPendingInvitations(invitations);
        }
      } catch (error) {
        console.error('Failed to check pending invitations:', error);
      }
    };

    checkInvitations();

    return () => {
      active = false;
    };
  }, [currentUser]);

  // Toggle the invitation panel and load pending invitations.
  const handleToggleInvitations = () => {
    if (invitationsOpen) {
      setInvitationsOpen(false);
      return;
    }

    setInvitationsOpen(true);
    loadPendingInvitations();
  };

  // Accept an invitation and update the pending invitation list.
  const handleAcceptInvitation = async (invitationId) => {
    if (!currentUser || acceptingInvitationId !== null) {
      return;
    }

    setAcceptingInvitationId(invitationId);
    setInvitationError('');

    try {
      await acceptProjectInvitation(currentUser, invitationId);

      setInvitationRefreshSignal((previousSignal) => previousSignal + 1);

      setPendingInvitations((previousInvitations) =>
        previousInvitations.filter(
          (invitation) => invitation.invitation_id !== invitationId
        )
      );
    } catch (error) {
      setInvitationError(
        error.message || 'Failed to accept invitation.'
      );
    } finally {
      setAcceptingInvitationId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser()

      setPendingInvitations([])
      setInvitationsOpen(false)
      setInvitationError('')
      setInvitationRefreshSignal(0)

      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <ProjectProvider>
      <InvitationProjectRefresh refreshSignal={invitationRefreshSignal} />
      <div className={`shell${isWorkspace ? ' shell--workspace' : ''}`}>
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <button
              className="shell-icon-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Reveal sidebar'}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="9" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <img src={logo} alt="Mosalinx" className="shell-brand-logo" />
          </div>

          <div className="shell-topbar-center">
            <span className="shell-app-name">{currentAppName}</span>
          </div>

          <div className="shell-topbar-right">
            <button
              className="shell-icon-btn"
              aria-label="Settings"
              onClick={() => navigate('/settings')}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 .33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            <div className="shell-profile" ref={profileMenuRef}>
              <button
                className={`shell-icon-btn${profileOpen ? ' is-open' : ''}${pendingInvitations.length > 0 ? ' has-invitations' : ''}`}
                aria-label="Profile"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="shell-profile-menu">
                  <div className="shell-profile-row">
                    <span className="shell-profile-label">First name</span>
                    <span className="shell-profile-value">
                      {firstName || 'Not set'}
                    </span>
                  </div>

                  <div className="shell-profile-row">
                    <span className="shell-profile-label">Last name</span>
                    <span className="shell-profile-value">
                      {lastName || 'Not set'}
                    </span>
                  </div>

                  <div className="shell-profile-row">
                    <span className="shell-profile-label">Email</span>
                    <span className="shell-profile-value">
                      {currentUser?.email ?? 'Not set'}
                    </span>
                  </div>

                  <div className="shell-profile-row">
                    <span className="shell-profile-label">User ID</span>
                    <span className="shell-profile-value shell-profile-uid">
                      {currentUser?.uid}
                    </span>
                  </div>

                  <button
                    className="shell-profile-invitations"
                    onClick={handleToggleInvitations}
                    aria-expanded={invitationsOpen}
                  >
                    <span>Pending Invitations</span>
                    {pendingInvitations.length > 0 && (
                      <span className="shell-invitation-count">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>

                  {invitationsOpen && (
                    <div className="shell-invitations-panel">
                      {loadingInvitations ? (
                        <p>Loading invitations...</p>
                      ) : invitationError ? (
                        <p className="shell-invitations-error" role="alert">
                          {invitationError}
                        </p>
                      ) : pendingInvitations.length === 0 ? (
                        <p>No pending invitations.</p>
                      ) : (
                        pendingInvitations.map((invitation) => (
                          <div
                            key={invitation.invitation_id}
                            className="shell-invitation-item"
                          >
                            <strong>
                              {invitation.project_name || 'Project invitation'}
                            </strong>
                            <span>
                              {invitation.inviter_name
                                ? `Invited by ${invitation.inviter_name}`
                                : 'You have been invited to collaborate.'}
                            </span>
                            <button
                              type="button"
                              className="shell-invitation-accept"
                              onClick={() => handleAcceptInvitation(invitation.invitation_id)}
                              disabled={
                                acceptingInvitationId !== null
                              }
                            >
                              {acceptingInvitationId === invitation.invitation_id
                                ? 'Accepting...'
                                : 'Accept Invitation'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <button
                    className="shell-profile-edit"
                    onClick={() => navigate('/profile')}
                  >
                    Edit Profile
                  </button>

                  <button
                    className="shell-profile-logout"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`shell-body shell-body--${sidebarPosition}`}>
          {sidebarOpen && <Sidebar position={sidebarPosition} />}

          <main className="shell-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ProjectProvider>
  )
}

export default Shell