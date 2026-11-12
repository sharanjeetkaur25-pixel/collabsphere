function ProjectTeam({
  members,
  memberEmail,
  setMemberEmail,
  handleInvite,
  inviting,
  inviteMessage,
}) {
  return (
    <div className="project-team">
      <div className="project-section-heading">
        <p className="project-section-eyebrow">COLLABORATION</p>
        <h2>Team Members</h2>
        <p>View your project team and invite people to collaborate.</p>
      </div>

      <div className="project-team-card">
        <h3>Current Members</h3>

        {members.length === 0 ? (
          <p>No team members have been added yet.</p>
        ) : (
          <ul>
            {members.map((member, index) => (
              <li key={member._id || member.id || index}>
                <span>
                  {typeof member === 'object'
                    ? member.name || 'Team member'
                    : 'Team member'}
                </span>

                {typeof member === 'object' && member.email && (
                  <span>{member.email}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="project-team-card">
        <h3>Invite a Team Member</h3>
        <p>Enter your teammate's email address to add them.</p>

        <form onSubmit={handleInvite}>
          <label htmlFor="member-email">
            Teammate's email address
          </label>

          <input
            id="member-email"
            type="email"
            value={memberEmail}
            onChange={(event) => setMemberEmail(event.target.value)}
            placeholder="teammate@example.com"
            required
          />

          <button type="submit" disabled={inviting}>
            {inviting ? 'Adding member...' : 'Invite Member'}
          </button>
        </form>

        {inviteMessage && (
          <p role="status">{inviteMessage}</p>
        )}
      </div>
    </div>
  )
}

export default ProjectTeam