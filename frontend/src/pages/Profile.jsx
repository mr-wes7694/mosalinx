import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  getUserAvatar,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/profileService.js'
import './Profile.css'

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const DEFAULT_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  birthdate: '',
  gender: '',
  pronouns: '',
  bio: '',
  avatarUrl: null,
}

function Profile() {
  const navigate = useNavigate()
  const {
    currentUser,
    loading: authLoading,
    userProfile,
    setUserProfile,
    profileLoading,
    profileError,
  } = useAuth()

  // Derive the saved profile from the shared persisted backend data.
  const [firstName, ...lastNameParts] = (userProfile?.displayName ?? '').trim().split(/\s+/)

  const savedProfile = userProfile
    ? {
      firstName: firstName || '',
      lastName: lastNameParts.join(' '),
      email: userProfile.email ?? '',
      birthdate: '',
      gender: '',
      pronouns: '',
      bio: userProfile.bio ?? '',
      avatarUrl: userProfile.profileImageUrl ?? null,
    }
    : DEFAULT_PROFILE

  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE)
  // Track saved avatar URLs so replacements can release old browser resources.
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(null)
  const savedAvatarUrlRef = useRef(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null)
  const previewAvatarUrlRef = useRef(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'cancel' | 'back'

  // Replace the displayed avatar and release its previous blob URL.
  function replaceSavedAvatarUrl(nextUrl) {
    if (savedAvatarUrlRef.current && savedAvatarUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(savedAvatarUrlRef.current)
    }

    savedAvatarUrlRef.current = nextUrl
    setSavedAvatarUrl(nextUrl)
  }

  // Release the active saved avatar when the Profile component unmounts.
  useEffect(() => {
    return () => {
      if (savedAvatarUrlRef.current) {
        URL.revokeObjectURL(savedAvatarUrlRef.current)
        savedAvatarUrlRef.current = null
      }
    }
  }, [])

  // Release an unsaved avatar preview when leaving the Profile page.
  useEffect(() => {
    return () => {
      if (previewAvatarUrlRef.current) {
        URL.revokeObjectURL(previewAvatarUrlRef.current)
        previewAvatarUrlRef.current = null
      }
    }
  }, [])

  // Load the authenticated user's saved avatar when its Storage reference changes.
  useEffect(() => {
    if (!currentUser || !userProfile?.userId || !userProfile.profileImageUrl) {
      return
    }

    let cancelled = false

    async function loadAvatar() {
      try {
        const imageBlob = await getUserAvatar(currentUser, userProfile.userId)

        if (cancelled) return

        const objectUrl = URL.createObjectURL(imageBlob)
        replaceSavedAvatarUrl(objectUrl)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load profile picture:', error)
        }
      }
    }

    loadAvatar()

    return () => {
      cancelled = true
    }
  }, [currentUser, userProfile?.userId, userProfile?.profileImageUrl])

  function updateField(key, value) {
    setDraftProfile((prev) => ({ ...prev, [key]: value }))
  }

  // Preview the selected image while retaining the file for upload.
  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      setSaveError('Please select a JPEG, PNG, or WebP image under 5 MB.')
      e.target.value = ''
      return
    }

    // Release the previous preview before creating a replacement.
    if (previewAvatarUrlRef.current) {
      URL.revokeObjectURL(previewAvatarUrlRef.current)
      previewAvatarUrlRef.current = null
    }

    setSaveError('')
    setSelectedAvatarFile(file)

    const previewUrl = URL.createObjectURL(file)
    previewAvatarUrlRef.current = previewUrl
    updateField('avatarUrl', previewUrl)

    e.target.value = ''
  }

  function isDirty() {
    return JSON.stringify(draftProfile) !== JSON.stringify(savedProfile)
  }

  function handleEdit() {
    setDraftProfile(savedProfile)
    setSaveError('')
    setIsEditing(true)
  }

  // Exit editing immediately when there are no unsaved changes.
  function handleCancel() {
    if (isDirty()) {
      setPendingAction('cancel')
      setShowCancelConfirm(true)
    } else {
      setSelectedAvatarFile(null)
      setDraftProfile(savedProfile)
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

  // Discard unsaved profile changes and release the temporary avatar preview.
  function confirmDiscard() {
    if (previewAvatarUrlRef.current) {
      URL.revokeObjectURL(previewAvatarUrlRef.current)
      previewAvatarUrlRef.current = null
    }

    setSelectedAvatarFile(null)
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

  async function handleSave() {
    if (saveLoading) return

    setSaveLoading(true)
    setSaveError('')

    try {
      const displayName = `${draftProfile.firstName} ${draftProfile.lastName}`.trim()

      const updates = {
        displayName,
        bio: draftProfile.bio || null,
      }

      // Save profile fields, then upload the selected picture if one exists.
      let updatedProfile = await updateUserProfile(currentUser, updates)

      if (selectedAvatarFile) {
        updatedProfile = await uploadUserAvatar(currentUser, selectedAvatarFile)

        // Retrieve the saved avatar, falling back to the selected image if needed.
        try {
          const imageBlob = await getUserAvatar(currentUser, updatedProfile.userId)
          const newAvatarUrl = URL.createObjectURL(imageBlob)

          replaceSavedAvatarUrl(newAvatarUrl)
        } catch (avatarError) {
          console.error('Avatar saved, but could not be reloaded:', avatarError)

          // Preserve the selected image as the displayed avatar until the next load.
          replaceSavedAvatarUrl(URL.createObjectURL(selectedAvatarFile))
        }
      }

      // Synchronize the account menu with the successfully saved profile.
      setUserProfile(updatedProfile)

      setDraftProfile((previous) => ({
        ...previous,
        firstName: (updatedProfile.displayName ?? '').trim().split(/\s+/)[0] || '',
        lastName: (updatedProfile.displayName ?? '').trim().split(/\s+/).slice(1).join(' '),
        bio: updatedProfile.bio ?? '',
      }))

      // Clear the pending upload after the picture is saved successfully.
      if (selectedAvatarFile) {
        if (previewAvatarUrlRef.current) {
          URL.revokeObjectURL(previewAvatarUrlRef.current)
          previewAvatarUrlRef.current = null
        }

        setSelectedAvatarFile(null)
      }

      setIsEditing(false)
    } catch (error) {
      setSaveError(error.message || 'Failed to save profile.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Keep the selected preview visible until the saved avatar is ready.
  const avatarToShow = selectedAvatarFile && isEditing
    ? draftProfile.avatarUrl
    : savedAvatarUrl

  // Show controlled UI states while profile data is loading or unavailable.
  if (authLoading || (currentUser && profileLoading)) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Profile</h1>
          <p>You must be signed in to view your profile.</p>
          <button className="profile-back" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Profile</h1>
          <p>{profileError}</p>
          <button className="profile-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

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

            {saveError && (
              <p className="profile-save-error">{saveError}</p>
            )}

            <div className="profile-form-actions">
              <button className="profile-cancel-btn" onClick={handleCancel}>Cancel</button>
              <button
                className="profile-save-btn"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : 'Save'}
              </button>
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