import { useEffect, useState } from 'react'
import { getUserAvatar } from '../services/profileService'
import './TeamMemberList.css'

// Retrieve and display one member's avatar.
function TeamMemberAvatar({ user, member }) {
  const [avatar, setAvatar] = useState(null)
  const name = member.display_name?.trim() || 'Unnamed Member'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  useEffect(() => {
    let cancelled = false
    let objectUrl = null

    async function loadAvatar() {
      if (!user || !member.profile_image_url) {
        return
      }

      try {
        const imageBlob = await getUserAvatar(user, member.user_id)
        objectUrl = URL.createObjectURL(imageBlob)

        if (!cancelled) {
          setAvatar({
            source: member.profile_image_url,
            url: objectUrl
          })
        }
      } catch {
        // Use initials if the avatar cannot be retrieved.
      }
    }

    loadAvatar()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [user, member.user_id, member.profile_image_url])

  const avatarUrl = avatar?.source === member.profile_image_url
    ? avatar.url
    : null

  return (
    <div className="team-member-avatar">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}

// Display project members independently of how their data is retrieved.
function TeamMemberList({
  members = [],
  user,
  loading = false,
  error = ''
}) {
  if (loading) {
    return <p role="status">Loading team members...</p>
  }

  if (error) {
    return <p role="alert">{error}</p>
  }

  if (members.length === 0) {
    return <p>No team members found for this project.</p>
  }

  return (
    <div className="team-member-list">
      {members.map((member) => {
        const name = member.display_name?.trim() || 'Unnamed Member'
        const isOwner = member.role === 'owner'

        return (
          <div className="team-member" key={member.user_id}>
            <TeamMemberAvatar user={user} member={member} />

            <div className="team-member-details">
              <span className="team-member-name">{name}</span>
              <span className="team-member-role">
                {isOwner
                  ? 'Owner'
                  : member.role === 'collaborator'
                    ? 'Collaborator'
                    : member.role || 'Member'}
              </span>
            </div>

            {isOwner && (
              <span className="team-member-owner" aria-label="Project owner">
                {'\u2605'} Owner
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TeamMemberList