import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import '../../App.css'
import API from '../../api'

function MyProjects() {
  const {
    user,
    projects,
    setProjects,
    projectsLoading,
    projectError,
    setProjectError,
    refreshProjects,
  } = useOutletContext()

  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('planning')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const [showShareModal, setShowShareModal] = useState(false)
  const [sharingProjectId, setSharingProjectId] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharing, setSharing] = useState(false)

  const getToken = () => localStorage.getItem('token')

  const isOwner = (project) => {
    const ownerId =
      typeof project.owner === 'object'
        ? project.owner?._id?.toString()
        : project.owner?.toString()

    const userId = user?._id?.toString() || user?.id?.toString()

    return ownerId === userId
  }

  const ownedProjects = projects.filter(isOwner)

  const filteredProjects = ownedProjects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreatingProject(true)
    setProjectError('')

    try {
      const response = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          status: 'planning',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project.')
      }

      setProjectName('')
      setProjectDescription('')
      setShowProjectForm(false)
      await refreshProjects()
    } catch (err) {
      setProjectError(err.message || 'Unable to create project.')
    } finally {
      setCreatingProject(false)
    }
  }

  const startEditing = (project) => {
    setEditingProjectId(project._id)
    setEditName(project.name || '')
    setEditDescription(project.description || '')
    setEditStatus(project.status || 'planning')
    setStatusDropdownOpen(false)
    setOpenMenuId(null)
  }

  const cancelEditing = () => {
    setEditingProjectId(null)
    setEditName('')
    setEditDescription('')
    setEditStatus('planning')
    setStatusDropdownOpen(false)
  }

  const handleUpdateProject = async (e, projectId) => {
    e.preventDefault()
    setSavingProject(true)
    setProjectError('')

    try {
      const response = await fetch(`${API}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          status: editStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project.')
      }

      cancelEditing()
      await refreshProjects()
    } catch (err) {
      setProjectError(err.message || 'Unable to update project.')
    } finally {
      setSavingProject(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project?'
    )

    if (!confirmed) return

    setDeletingProjectId(projectId)
    setProjectError('')
    setOpenMenuId(null)

    try {
      const response = await fetch(`${API}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project.')
      }

      setProjects((previousProjects) =>
        previousProjects.filter((project) => project._id !== projectId)
      )

      if (editingProjectId === projectId) {
        cancelEditing()
      }
    } catch (err) {
      setProjectError(err.message || 'Unable to delete project.')
    } finally {
      setDeletingProjectId(null)
    }
  }

  const handleShareProject = (projectId) => {
    setSharingProjectId(projectId)
    setShareEmail('')
    setProjectError('')
    setShowShareModal(true)
  }

  const submitShareProject = async (e) => {
    e.preventDefault()

    setSharing(true)
    setProjectError('')

    try {
      const response = await fetch(
        `${API}/projects/${sharingProjectId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            email: shareEmail.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share project.')
      }

      setShowShareModal(false)
      setSharingProjectId(null)
      setShareEmail('')

      window.alert(data.message || 'Project shared successfully!')
      await refreshProjects()
    } catch (err) {
      setProjectError(err.message || 'Unable to share project.')
    } finally {
      setSharing(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Date unavailable'

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatStatus = (status) => {
    if (!status) return 'Planning'

    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const renderProject = (project) => (
    <article className="my-project-card" key={project._id}>
      {editingProjectId === project._id ? (
        <form
          className="project-edit-form"
          onSubmit={(e) => handleUpdateProject(e, project._id)}
        >
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Project name"
            required
          />

          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Project description"
          />

          <div className="custom-status-dropdown">
            <button
              type="button"
              className="custom-status-button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              aria-expanded={statusDropdownOpen}
            >
              {formatStatus(editStatus)}
              <span>{statusDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {statusDropdownOpen && (
              <div className="custom-status-options">
                {[
                  { value: 'planning', label: 'Planning' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ].map((status) => (
                  <button
                    type="button"
                    key={status.value}
                    className={editStatus === status.value ? 'selected' : ''}
                    onClick={() => {
                      setEditStatus(status.value)
                      setStatusDropdownOpen(false)
                    }}
                  >
                    {status.label}
                    {editStatus === status.value && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="project-card-actions">
            <button type="submit" disabled={savingProject}>
              {savingProject ? 'Saving...' : 'Save Changes'}
            </button>

            <button type="button" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="my-project-card-body">
          <div className="my-project-card-heading">
            <h3>{project.name}</h3>

            <span
              className={`my-project-status status-${project.status || 'planning'}`}
            >
              {formatStatus(project.status)}
            </span>
          </div>

          <p className="my-project-description">
            {project.description || 'No description added yet.'}
          </p>

          <div className="my-project-card-footer">
            <span className="my-project-date">
              <span>▢</span>
              Created {formatDate(project.createdAt)}
            </span>

            <div className="my-project-menu-wrapper">
              <button
                type="button"
                className="my-project-menu-button"
                onClick={() =>
                  setOpenMenuId(
                    openMenuId === project._id ? null : project._id
                  )
                }
                aria-label="Project actions"
              >
                ⋮
              </button>

              {openMenuId === project._id && (
                <div className="my-project-menu">
                  <Link to={`/projects/${project._id}`}>
                    Open Project
                  </Link>

                  <button
                    type="button"
                    onClick={() => startEditing(project)}
                  >
                    Edit Project
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null)
                      handleShareProject(project._id)
                    }}
                  >
                    Share Project
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project._id)}
                    disabled={deletingProjectId === project._id}
                  >
                    {deletingProjectId === project._id
                      ? 'Deleting...'
                      : 'Delete Project'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )

  return (
    <div className="my-projects-page">
      <header className="my-projects-header">
        <div>
          <h1>My Projects</h1>
          <p>Create and manage your own projects.</p>
        </div>

        <button
          type="button"
          className="my-projects-new-button"
          onClick={() => setShowProjectForm(!showProjectForm)}
        >
          {showProjectForm ? '✕ Cancel' : '+ New Project'}
        </button>
      </header>

      <div className="my-projects-toolbar">
        <div className="my-projects-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search your projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="custom-status-dropdown my-projects-filter-dropdown">
          <button
            type="button"
            className="custom-status-button"
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            aria-expanded={filterDropdownOpen}
          >
            {statusFilter === 'all'
              ? 'All Projects'
              : formatStatus(statusFilter)}
            <span>{filterDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {filterDropdownOpen && (
            <div className="custom-status-options">
              {[
                { value: 'all', label: 'All Projects' },
                { value: 'planning', label: 'Planning' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ].map((status) => (
                <button
                  type="button"
                  key={status.value}
                  className={statusFilter === status.value ? 'selected' : ''}
                  onClick={() => {
                    setStatusFilter(status.value)
                    setFilterDropdownOpen(false)
                  }}
                >
                  {status.label}
                  {statusFilter === status.value && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {projectError && (
        <p className="error-message">{projectError}</p>
      )}

      {showProjectForm && (
        <form
          className="my-project-create-form"
          onSubmit={handleCreateProject}
        >
          <h2>Create New Project</h2>

          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            required
          />

          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Project description"
          />

          <button type="submit" disabled={creatingProject}>
            {creatingProject ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {projectsLoading ? (
        <p className="my-projects-message">Loading projects...</p>
      ) : (
        <div className="my-projects-grid">
          {filteredProjects.map(renderProject)}

          <button
            type="button"
            className="my-project-create-card"
            onClick={() => setShowProjectForm(true)}
          >
            <span className="my-project-create-icon">+</span>
            <strong>Create New Project</strong>
            <span>Start a new project and organize your work.</span>
          </button>
        </div>
      )}

      {!projectsLoading && filteredProjects.length === 0 && (
        <p className="my-projects-message">
          {searchTerm || statusFilter !== 'all'
            ? 'No projects match your search.'
            : "You haven't created any projects yet."}
        </p>
      )}

      {showShareModal && (
        <div className="share-modal-overlay">
          <form className="share-modal" onSubmit={submitShareProject}>
            <button
              type="button"
              className="share-modal-close"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            <h2>Share Project</h2>
            <p>Enter the email of an existing CollabSphere user.</p>

            <input
              className="share-email-input"
              type="email"
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={sharing}>
              {sharing ? 'Sharing...' : 'Share Project'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default MyProjects