import './TeamMemberList.css'

// Display project members independently of how their data is retrieved.
function TeamMemberList({ members = [], loading = false, error = "" }) {
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
        const name = member.display_name?.trim() || "Unnamed Member"
        const initials = name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("")
        const isOwner = member.role === "owner"

        return (
          <div className="team-member" key={member.user_id}>
            <div className="team-member-avatar">
              {member.profile_image_url ? (
                <img src={member.profile_image_url} alt="" />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
            </div>

            <div className="team-member-details">
              <span className="team-member-name">{name}</span>
              <span className="team-member-role">
                {isOwner ? "Owner" : member.role === "collaborator" ? "Collaborator" : member.role || "Member"}
              </span>
            </div>

            {isOwner && (
              <span className="team-member-owner" aria-label="Project owner">
                {"\u2605"} Owner
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TeamMemberList
