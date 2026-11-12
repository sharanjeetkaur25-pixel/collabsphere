function ProjectOverview({
  project,
  onPublicSharing,
  onCopyPublicLink,
  shareLoading,
  shareMessage,
}) {
  const owner =
    typeof project.owner === 'object'
      ? project.owner?.name ||
        project.owner?.email ||
        'Project owner'
      : 'Project owner'

  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : 'Not available'

  return (
    <div className="project-overview">
      <section className="project-overview-header">
        <div>
          <h2>Overview</h2>
          <p>
            Your project's details, status, and access settings.
          </p>
        </div>

        <span className="project-status">
          {project.status || 'Not specified'}
        </span>
      </section>

      <section className="project-overview-details">
        <div className="project-overview-card">
          <span className="project-detail-label">Project Name</span>
          <h3>{project.name}</h3>
        </div>

        <div className="project-overview-card">
          <span className="project-detail-label">Project Owner</span>
          <h3>{owner}</h3>
        </div>

        <div className="project-overview-card">
          <span className="project-detail-label">Created On</span>
          <h3>{createdDate}</h3>
        </div>

        <div className="project-overview-card project-description-card">
          <span className="project-detail-label">Description</span>
          <p>
            {project.description || 'No description provided.'}
          </p>
        </div>
      </section>

      <section className="project-sharing-section">
        <div className="project-sharing-heading">
          <div>
            <h3>Public Sharing</h3>
            <p>
              Control whether people with your public link can view
              this project's information.
            </p>
          </div>

          <span className={project.isPublic ? 'sharing-enabled' : 'sharing-disabled'}>
            {project.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        <div className="project-sharing-actions">
          <button
            type="button"
            onClick={onPublicSharing}
            disabled={shareLoading}
          >
            {shareLoading
              ? 'Updating...'
              : project.isPublic
                ? 'Disable Public Sharing'
                : 'Enable Public Sharing'}
          </button>

          {project.isPublic && project.publicToken && (
            <button
              type="button"
              onClick={onCopyPublicLink}
            >
              Copy Public Link
            </button>
          )}
        </div>

        {shareMessage && (
          <p className="project-sharing-message" role="status">
            {shareMessage}
          </p>
        )}
      </section>
    </div>
  )
}

export default ProjectOverview