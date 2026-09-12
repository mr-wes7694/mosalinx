import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import './Profile.css'

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

function Profile() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const displayName = currentUser?.displayName ?? ''
  const [initialFirst, ...rest] = displayName.split(' ')
  const initialLast = rest.join(' ')

  const DEFAULT_PROFILE = {
    firstName: initialFirst || '',
    lastName: initialLast || '',
    email: currentUser?.email ?? '',
    birthdate: '',
    gender: '',
    pronouns: '',
    bio: '',
    avatarUrl: null,
  }

  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE)
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'cancel' | 'back'

  function updateField(key, value) {
    setDraftProfile((prev) => ({ ...prev, [key]: value }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateField('avatarUrl', url)
  }

  function isDirty() {
    return JSON.stringify(draftProfile) !== JSON.stringify(savedProfile)
  }

  function handleEdit() {
    setDraftProfile(savedProfile)
    setIsEditing(true)
  }

  function handleCancel() {
    if (isDirty()) {
      setPendingAction('cancel')
      setShowCancelConfirm(true)
    } else {
      setIsEditing(false)
    }
  }

  function handleBack() {
    if (isEditing && isDirty()) {
      setPendingAction('back')
      setShowCancelConfirm(true)
    } else {
      navigate('/dashboard')
    }
  }

  function confirmDiscard() {
    setDraftProfile(savedProfile)
    setShowCancelConfirm(false)
    setIsEditing(false)
    if (pendingAction === 'back') {
      navigate('/dashboard')
    }
    setPendingAction(null)
  }

  function dismissConfirm() {
    setShowCancelConfirm(false)
    setPendingAction(null)
  }

  function handleSave() {
    setSavedProfile(draftProfile)
    setIsEditing(false)
  }

  const avatarToShow = isEditing ? draftProfile.avatarUrl : savedProfile.avatarUrl

  return (
    <div className="profile-page">
      <button className="profile-back" onClick={handleBack}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>

      <div className="profile-card">
        <div className="profile-card-header">
          <h1>Profile</h1>
          {!isEditing && (
            <button className="profile-edit-btn" onClick={handleEdit}>
              Edit
            </button>
          )}
        </div>

        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {avatarToShow ? (
              <img src={avatarToShow} alt="Profile" className="profile-avatar-img" />
            ) : (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" className="profile-avatar-placeholder">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>

          {isEditing && (
            <label className="profile-avatar-upload">
              Change photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-view">
            <ProfileRow label="First name" value={savedProfile.firstName} />
            <ProfileRow label="Last name" value={savedProfile.lastName} />
            <ProfileRow label="Email" value={savedProfile.email} />
            <ProfileRow label="Birthdate" value={savedProfile.birthdate} />
            <ProfileRow label="Gender" value={savedProfile.gender} />
            <ProfileRow label="Pronouns" value={savedProfile.pronouns} />
            <ProfileRow label="Bio" value={savedProfile.bio} multiline />
          </div>
        ) : (
          <div className="profile-form">
            <div className="profile-field">
              <label className="profile-field-label" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                className="profile-input"
                value={draftProfile.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                className="profile-input"
                value={draftProfile.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="profile-input"
                value={draftProfile.email}
                disabled
              />
              <span className="profile-field-hint">Changing your email is handled separately.</span>
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="birthdate">Birthdate</label>
              <input
                id="birthdate"
                type="date"
                className="profile-input"
                value={draftProfile.birthdate}
                onChange={(e) => updateField('birthdate', e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                className="profile-input"
                value={draftProfile.gender}
                onChange={(e) => updateField('gender', e.target.value)}
              >
                <option value="">Select…</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="pronouns">Pronouns</label>
              <input
                id="pronouns"
                type="text"
                className="profile-input"
                placeholder="e.g. she/her, they/them"
                value={draftProfile.pronouns}
                onChange={(e) => updateField('pronouns', e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field-label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="profile-textarea"
                rows={4}
                value={draftProfile.bio}
                onChange={(e) => updateField('bio', e.target.value)}
              />
            </div>

            <div className="profile-form-actions">
              <button className="profile-cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="profile-save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div className="profile-modal-overlay" onClick={dismissConfirm}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="profile-modal-title">Discard changes?</h2>
            <p className="profile-modal-text">
              You have unsaved changes. If you leave now, they'll be lost.
            </p>
            <div className="profile-modal-actions">
              <button className="profile-modal-stay" onClick={dismissConfirm}>
                Keep editing
              </button>
              <button className="profile-modal-discard" onClick={confirmDiscard}>
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileRow({ label, value, multiline }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span className={'profile-row-value' + (multiline ? ' profile-row-value--multiline' : '')}>
        {value || <span className="profile-row-empty">Not set</span>}
      </span>
    </div>
  )
}

export default Profile