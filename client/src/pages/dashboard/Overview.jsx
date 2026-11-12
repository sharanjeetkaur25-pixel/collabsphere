
import { useOutletContext } from 'react-router-dom'
import '../../App.css'

function Overview() {
  const { user, projects, projectsLoading, projectError } =
    useOutletContext()

  const userId = user?._id?.toString() || user?.id?.toString()

  const isOwner = (project) => {
    const ownerId =
      typeof project.owner === 'object'
        ? project.owner?._id?.toString()
        : project.owner?.toString()

    return ownerId === userId
  }

  const ownedProjects = projects.filter(isOwner)
  const sharedProjects = projects.filter((project) => !isOwner(project))

  const getStatus = (project) =>
    (project.status || 'planning').toLowerCase().trim().replace(/-/g, ' ')

  const statusCategories = [
    { label: 'Planning', value: 'planning' },
    { label: 'In Progress', value: 'in progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'On Hold', value: 'on hold' },
  ]

  const statusCounts = statusCategories.map((category) => ({
    ...category,
    count: projects.filter((project) => {
      const status = getStatus(project)

      if (category.value === 'in progress') {
        return status === 'in progress' || status === 'active'
      }

      return status === category.value
    }).length,
  }))

  const totalProjects = projects.length

  return (
    <div className="overview-page">

      {/* Welcome Header */}
      <header className="overview-header">
        <div>
          <span className="overview-eyebrow">YOUR WORKSPACE</span>
          <h1>Welcome back, {user?.name || 'Developer'}!</h1>
          <p>Here's what's happening with your workspace.</p>
        </div>

        <div className="overview-account">
          <div className="overview-avatar">
            {(user?.name || 'D').charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name || 'Developer'}</strong>
            <span>{user?.email || ''}</span>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="overview-hero">
        <div>
          <h2>Better ideas. Stronger teams.</h2>
          <p>
            Collaborate, manage projects and build what matters.
          </p>
        </div>

        <span className="overview-hero-decoration">✧</span>
      </section>

      {/* Project Statistics */}
      <section className="overview-stats">

        <article className="overview-stat">
          <span className="overview-stat-icon">▣</span>

          <div>
            <p>My Projects</p>
            <strong>
              {projectsLoading ? '—' : ownedProjects.length}
            </strong>
          </div>
        </article>

        <article className="overview-stat">
          <span className="overview-stat-icon">♧</span>

          <div>
            <p>Shared Projects</p>
            <strong>
              {projectsLoading ? '—' : sharedProjects.length}
            </strong>
          </div>
        </article>

        <article className="overview-stat">
          <span className="overview-stat-icon">✧</span>

          <div>
            <p>Active Projects</p>
            <strong>
              {projectsLoading
                ? '—'
                : statusCounts.find(
                    (item) => item.value === 'in progress'
                  ).count}
            </strong>
          </div>
        </article>

      </section>

      {/* Project Loading / Error */}
      {projectError && (
        <p className="overview-error">{projectError}</p>
      )}

      {/* Profile + Project Status */}
      <div className="overview-bottom">

        {/* Profile Information - Left */}
        <section className="overview-info-card">
          <span className="overview-eyebrow">YOUR ACCOUNT</span>

          <h2>Profile Information</h2>

          <div className="overview-profile-row">
            <span>Name</span>
            <strong>{user?.name || 'Not available'}</strong>
          </div>

          <div className="overview-profile-row">
            <span>Email</span>
            <strong>{user?.email || 'Not available'}</strong>
          </div>
        </section>

        {/* Project Status Overview - Right */}
        <section className="overview-status-section">
          <div className="overview-status-heading">
            <div>
              <span className="overview-eyebrow">WORKSPACE PROGRESS</span>
              <h2>Project Status Overview</h2>
              <p>See how your projects are progressing.</p>
            </div>

            <span className="overview-status-total">
              {projectsLoading ? '—' : totalProjects} Total
            </span>
          </div>

          {projectsLoading ? (
            <p className="overview-empty">
              Loading project statistics...
            </p>
          ) : (
            <>
              <div
                className="overview-status-bar"
                role="img"
                aria-label={statusCounts
                  .map((item) => `${item.label}: ${item.count}`)
                  .join(', ')}
              >
                {statusCounts.map((item) => (
                  <span
                    key={item.value}
                    className={`overview-status-segment status-${item.value.replace(/\s+/g, '-')}`}
                    style={{
                      width: totalProjects
                        ? `${(item.count / totalProjects) * 100}%`
                        : '0%',
                    }}
                  />
                ))}
              </div>

              <div className="overview-status-grid">
                {statusCounts.map((item) => (
                  <article
                    className="overview-status-item"
                    key={item.value}
                  >
                    <div className="overview-status-label">
                      <span
                        className={`overview-status-dot status-${item.value.replace(/\s+/g, '-')}`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <strong>{item.count}</strong>
                  </article>
                ))}
              </div>

              {totalProjects === 0 && (
                <p className="overview-empty">
                  Your project status summary will appear here when you
                  create or join projects.
                </p>
              )}
            </>
          )}
        </section>

      </div>

    </div>
  )
}

export default Overview
