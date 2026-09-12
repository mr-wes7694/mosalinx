import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import './Shell.css'
import Sidebar from './Sidebar.jsx'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { logoutUser } from '../services/authService'

const APP_NAMES = {
  '/dashboard': 'Bulletin Board',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/messages': 'Messages',
  '/dashboard/statistics': 'Statistics',
  '/dashboard/resources': 'Resources',
  '/dashboard/workspace': 'Workspace',
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { currentUser } = useAuth()
const [profileOpen, setProfileOpen] = useState(false)
const profileMenuRef = useRef(null)

useEffect(() => {
  function handleClickOutside(e) {
    if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
      setProfileOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

const displayName = currentUser?.displayName ?? ''
const [firstName, ...lastNameParts] = displayName.split(' ')
const lastName = lastNameParts.join(' ')
  const sidebarPosition = 'left' // To be developed with settings
  const location = useLocation()
  const navigate = useNavigate()
  const currentAppName = APP_NAMES[location.pathname] ?? 'Mosalinx'

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="shell">
      <header className="shell-topbar">
        <div className="shell-topbar-left">
          <button
            className="shell-icon-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Reveal sidebar'} /* adding a collapse/reveal button for the sidebar. */
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="9" y1="4" x2="9" y2="20" />
            </svg>
          </button>
        </div>

        <div className="shell-topbar-center">
          <span className="shell-app-name">{currentAppName}</span> {/* Adding feature to show current selected app or view at the top middle of screen.*/}
        </div>

        <div className="shell-topbar-right">
          <button className="shell-icon-btn" aria-label="Settings" onClick={() => navigate('/settings')}> {/*Settings icon*/}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <div className="shell-profile" ref={profileMenuRef}>
  <button
  className={`shell-icon-btn${profileOpen ? ' is-open' : ''}`}
  aria-label="Profile"
  onClick={() => setProfileOpen((open) => !open)}
>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  </button>

  {profileOpen && (
    <div className="shell-profile-menu">
      <div className="shell-profile-row">
        <span className="shell-profile-label">First name</span>
        <span className="shell-profile-value">{firstName || 'Not set'}</span>
      </div>
      <div className="shell-profile-row">
        <span className="shell-profile-label">Last name</span>
        <span className="shell-profile-value">{lastName || 'Not set'}</span>
      </div>
      <div className="shell-profile-row">
        <span className="shell-profile-label">Email</span>
        <span className="shell-profile-value">{currentUser?.email ?? 'Not set'}</span>
      </div>
      <div className="shell-profile-row">
        <span className="shell-profile-label">User ID</span>
        <span className="shell-profile-value shell-profile-uid">{currentUser?.uid}</span>
      </div>
      <button className="shell-profile-edit" onClick={() => navigate('/profile')}>Edit Profile</button>
      <button className="shell-profile-logout" onClick={handleLogout}>Log out</button>
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
    )
}

export default Shell