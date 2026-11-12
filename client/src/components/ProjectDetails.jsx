import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProjectAnalytics from './ProjectAnalytics'
import ProjectOverview from './ProjectOverview'
import ProjectTeam from './ProjectTeam'
import ProjectFiles from './ProjectFiles'
import ProjectNotes from './ProjectNotes'
import ProjectAIStudio from './ProjectAIStudio'
import './OpenProject.css'
import API from '../api'

const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.json', '.css', '.html',
]

const TEXT_EXTENSIONS = [...CODE_EXTENSIONS, '.txt', '.md']

const getExtension = (filename = '') => {
  const index = filename.lastIndexOf('.')
  return index >= 0 ? filename.slice(index).toLowerCase() : ''
}

function ProjectDetails() {
  const { id } = useParams()
  const token = localStorage.getItem('token')

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')

  // Public sharing
  const [shareMessage, setShareMessage] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  // Team
  const [memberEmail, setMemberEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)

  // Notes
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteMessage, setNoteMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Gemini notes assistant
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Files
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [fileMessage, setFileMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [codeResult, setCodeResult] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  // README generator
  const [readmeResult, setReadmeResult] = useState('')
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [readmeMessage, setReadmeMessage] = useState('')

  // Common authenticated API request
  const request = async (url, options = {}) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${API}${url}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }

    return data
  }

  // Load project
  const fetchProject = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await request(`/projects/${id}`)
      setProject(data.project || data)
    } catch (err) {
      setError(err.message || 'Unable to load project')
    } finally {
      setLoading(false)
    }
  }

  // Load notes
  const fetchNotes = async () => {
    try {
      setNotesLoading(true)
      const data = await request(`/projects/${id}/notes`)
      const fetchedNotes = data.notes || []
      setNotes(fetchedNotes)

      if (selectedNoteId) {
        const current = fetchedNotes.find(
          (note) => note._id === selectedNoteId
        )

        if (current) {
          setTitle(current.title)
          setContent(current.content || '')
        } else {
          setSelectedNoteId('')
          setTitle('')
          setContent('')
        }
      }
    } catch (err) {
      setNoteMessage(err.message || 'Unable to load notes')
    } finally {
      setNotesLoading(false)
    }
  }

  // Load files
  const fetchFiles = async () => {
    try {
      setFilesLoading(true)
      const data = await request(`/projects/${id}/files`)
      setFiles(data.files || [])
    } catch (err) {
      setFileMessage(err.message || 'Unable to load project files')
    } finally {
      setFilesLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id])

  useEffect(() => {
    setNotes([])
    setSelectedNoteId('')
    setTitle('')
    setContent('')
    setAiResult('')
    setNoteMessage('')
    fetchNotes()
  }, [id])

  useEffect(() => {
    setFiles([])
    setSelectedFile(null)
    setFileMessage('')
    setPreviewUrl('')
    setPreviewText('')
    setCodeResult('')
    fetchFiles()
  }, [id])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const closePreview = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setPreviewText('')
  }

  // Public project sharing
  const handlePublicSharing = async () => {
    try {
      setShareLoading(true)
      setShareMessage('')

      if (project?.isPublic && project?.publicToken) {
        await request(`/projects/${id}/share`, { method: 'DELETE' })

        setProject((previous) => ({
          ...previous,
          isPublic: false,
          publicToken: '',
        }))

        setShareMessage('Public sharing disabled.')
        return
      }

      const data = await request(`/projects/${id}/share`, {
        method: 'POST',
      })

      setProject((previous) => ({
        ...previous,
        isPublic: true,
        publicToken: data.publicToken,
      }))

      setShareMessage('Public sharing enabled.')
    } catch (err) {
      setShareMessage(err.message || 'Unable to update public sharing.')
    } finally {
      setShareLoading(false)
    }
  }

  const copyPublicLink = async () => {
    if (!project?.publicToken) return

    const publicUrl =
      `${window.location.origin}/public/projects/${project.publicToken}`

    try {
      await navigator.clipboard.writeText(publicUrl)
      setShareMessage('Public link copied to clipboard.')
    } catch {
      setShareMessage(`Copy this link manually: ${publicUrl}`)
    }
  }

  // Invite team member
  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteMessage('')

    if (!memberEmail.trim()) {
      setInviteMessage("Please enter a teammate's email.")
      return
    }

    try {
      setInviting(true)

      const data = await request(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.trim() }),
      })

      setInviteMessage(data.message || 'Member added successfully!')
      setMemberEmail('')
      await fetchProject()
    } catch (err) {
      setInviteMessage(err.message || 'Unable to invite member')
    } finally {
      setInviting(false)
    }
  }

  // Notes
  const startNewNote = () => {
    setSelectedNoteId('')
    setTitle('')
    setContent('')
    setNoteMessage('')
    setAiResult('')
  }

  const selectNote = (note) => {
    setSelectedNoteId(note._id)
    setTitle(note.title)
    setContent(note.content || '')
    setNoteMessage('')
    setAiResult('')
  }

  const saveNote = async (e) => {
    e.preventDefault()
    setNoteMessage('')
    setAiResult('')

    if (!title.trim()) {
      setNoteMessage('Please enter a note title.')
      return
    }

    try {
      setSaving(true)

      const isEditing = Boolean(selectedNoteId)
      const endpoint = isEditing
        ? `/projects/${id}/notes/${selectedNoteId}`
        : `/projects/${id}/notes`

      const data = await request(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({ title: title.trim(), content }),
      })

      const savedNote = data.note

      if (savedNote?._id) {
        setSelectedNoteId(savedNote._id)
        setTitle(savedNote.title)
        setContent(savedNote.content || '')
      }

      setNoteMessage(data.message || 'Note saved successfully.')

      const refreshed = await request(`/projects/${id}/notes`)
      setNotes(refreshed.notes || [])
    } catch (err) {
      setNoteMessage(err.message || 'Unable to save note')
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async () => {
    if (!selectedNoteId) return
    if (!window.confirm('Delete this note permanently?')) return

    try {
      await request(`/projects/${id}/notes/${selectedNoteId}`, {
        method: 'DELETE',
      })

      setNotes((previous) =>
        previous.filter((note) => note._id !== selectedNoteId)
      )

      startNewNote()
      setNoteMessage('Note deleted successfully.')
    } catch (err) {
      setNoteMessage(err.message || 'Unable to delete note')
    }
  }

  // Gemini assistant for notes
  const runAI = async (action) => {
    if (!content.trim()) {
      setNoteMessage('Write some note content before using AI.')
      return
    }

    try {
      setAiLoading(true)
      setAiResult('')
      setNoteMessage('')

      const endpoint = action === 'explain' ? 'explain' : 'docs'

      const data = await request(`/gemini/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })

      setAiResult(data.result || 'No AI response was returned.')
    } catch (err) {
      setNoteMessage(err.message || 'Gemini AI request failed.')
    } finally {
      setAiLoading(false)
    }
  }

  // Generate README
  const generateReadme = async () => {
    try {
      setReadmeLoading(true)
      setReadmeMessage('')
      setReadmeResult('')

      const data = await request('/gemini/readme', {
        method: 'POST',
        body: JSON.stringify({ projectId: id }),
      })

      setReadmeResult(data.result || '')

      if (!data.result) {
        setReadmeMessage('The AI returned an empty README.')
      }
    } catch (err) {
      setReadmeMessage(err.message || 'Unable to generate README.')
    } finally {
      setReadmeLoading(false)
    }
  }

  const downloadReadme = () => {
    if (!readmeResult) return

    const blob = new Blob([readmeResult], {
      type: 'text/markdown;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'README.md'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  // Upload a project file
  const handleFileUpload = async (e) => {
    e.preventDefault()

    const input = e.currentTarget.elements.namedItem('project-file')
    const file = input?.files?.[0]

    if (!file) {
      setFileMessage('Please select a file to upload.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileMessage('File size must be 5 MB or less.')
      return
    }

    try {
      setUploading(true)
      setFileMessage('')
      setCodeResult('')

      const formData = new FormData()
      formData.append('file', file)

      const data = await request(`/projects/${id}/files`, {
        method: 'POST',
        body: formData,
      })

      setFileMessage(data.message || 'File uploaded successfully.')
      input.value = ''
      await fetchFiles()
    } catch (err) {
      setFileMessage(err.message || 'Unable to upload file')
    } finally {
      setUploading(false)
    }
  }

  // Preview an uploaded file
  const previewFile = async (file) => {
    try {
      setPreviewLoading(true)
      setFileMessage('')
      setCodeResult('')
      setSelectedFile(file)
      setPreviewUrl('')
      setPreviewText('')

      const response = await fetch(
        `${API}/projects/${id}/files/${file._id}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) {
        let message = 'Unable to preview this file.'

        try {
          const data = await response.json()
          message = data.message || message
        } catch {
          // Keep the default error message.
        }

        throw new Error(message)
      }

      const extension = getExtension(file.originalName)

      if (TEXT_EXTENSIONS.includes(extension)) {
        setPreviewText(await response.text())
      } else {
        const blob = await response.blob()
        setPreviewUrl(URL.createObjectURL(blob))
      }
    } catch (err) {
      setFileMessage(err.message || 'Unable to preview file')
      setSelectedFile(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Delete an uploaded file
  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}" permanently?`)) {
      return
    }

    try {
      setFileMessage('')
      setCodeResult('')

      await request(`/projects/${id}/files/${file._id}`, {
        method: 'DELETE',
      })

      setFiles((previous) =>
        previous.filter((item) => item._id !== file._id)
      )

      if (selectedFile?._id === file._id) closePreview()

      setFileMessage('File deleted successfully.')
    } catch (err) {
      setFileMessage(err.message || 'Unable to delete file')
    }
  }

  // Explain code using Gemini
  const explainCode = async (file) => {
    try {
      setCodeLoading(true)
      setCodeResult('')
      setFileMessage('')

      const data = await request('/gemini/code', {
        method: 'POST',
        body: JSON.stringify({ projectId: id, fileId: file._id }),
      })

      setCodeResult(data.result || 'No AI response was returned.')
    } catch (err) {
      setFileMessage(err.message || 'Unable to explain this code')
    } finally {
      setCodeLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard">
        <p>Loading project...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard">
        <p>{error}</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </main>
    )
  }

  if (!project?.name) {
    return (
      <main className="dashboard">
        <p>Project not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </main>
    )
  }

  const members = Array.isArray(project.members) ? project.members : []

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'analytics', label: 'Analytics', icon: '▥' },
    { id: 'team', label: 'Team', icon: '♧' },
    { id: 'files', label: 'Files', icon: '▤' },
    { id: 'notes', label: 'Notes', icon: '▧' },
    { id: 'ai', label: 'AI Studio', icon: '✧' },
  ]

  return (
    <main className="dashboard project-dashboard">
      <Link className="project-back-link" to="/dashboard">
        ← Back to Dashboard
      </Link>

      <section className="project-details project-workspace">
        <header className="project-workspace-header">
          <div>
            <p className="project-eyebrow">PROJECT WORKSPACE</p>
            <h1>{project.name}</h1>
            <p>{project.description || 'No description provided.'}</p>
          </div>

          <span
            className={`project-status-badge status-${(
              project.status || 'planning'
            ).toLowerCase().replace(/\s+/g, '-')}`}
          >
            {project.status || 'Planning'}
          </span>
        </header>

        <div className="project-workspace-layout">
          <aside className="project-sidebar">
            <p className="project-sidebar-heading">WORKSPACE</p>

            <nav aria-label="Project workspace sections">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`project-sidebar-link ${
                    activeSection === item.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveSection(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <span className="project-sidebar-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <span className="project-sidebar-indicator" />
                  )}
                </button>
              ))}
            </nav>

            <div className="project-sidebar-footer">
              <span className="project-sidebar-status-dot" />
              Project workspace
            </div>
          </aside>

          <div className="project-workspace-content">

            {activeSection === 'overview' && (
              <section className="project-workspace-section">
                <ProjectOverview
                  project={project}
                  onPublicSharing={handlePublicSharing}
                  onCopyPublicLink={copyPublicLink}
                  shareLoading={shareLoading}
                  shareMessage={shareMessage}
                />
              </section>
            )}

            {activeSection === 'analytics' && (
              <section className="project-workspace-section">
                <ProjectAnalytics projectId={id} />
                <div className="project-sharing-panel">
                  <h3>Public sharing</h3>
                  <p>
                    {project.isPublic
                      ? 'This project is currently publicly accessible through its share link.'
                      : 'Enable public sharing to create a link for this project.'}
                  </p>
                  <button
                    type="button"
                    onClick={handlePublicSharing}
                    disabled={shareLoading}
                  >
                    {shareLoading
                      ? 'Please wait...'
                      : project.isPublic
                        ? 'Disable public sharing'
                        : 'Enable public sharing'}
                  </button>

                  {project.isPublic && project.publicToken && (
                    <button type="button" onClick={copyPublicLink}>
                      Copy public link
                    </button>
                  )}

                  {shareMessage && <p role="status">{shareMessage}</p>}
                </div>
              </section>
            )}

            {activeSection === 'team' && (
              <section className="project-workspace-section">
                <ProjectTeam
                  members={members}
                  memberEmail={memberEmail}
                  setMemberEmail={setMemberEmail}
                  handleInvite={handleInvite}
                  inviting={inviting}
                  inviteMessage={inviteMessage}
                />
              </section>
            )}

            {activeSection === 'files' && (
              <section className="project-workspace-section">
                <ProjectFiles
                  files={files}
                  filesLoading={filesLoading}
                  handleFileUpload={handleFileUpload}
                  uploading={uploading}
                  fileMessage={fileMessage}
                  getExtension={getExtension}
                  codeExtensions={CODE_EXTENSIONS}
                  previewFile={previewFile}
                  previewLoading={previewLoading}
                  explainCode={explainCode}
                  codeLoading={codeLoading}
                  deleteFile={deleteFile}
                  selectedFile={selectedFile}
                  closePreview={closePreview}
                  previewText={previewText}
                  previewUrl={previewUrl}
                  textExtensions={TEXT_EXTENSIONS}
                  codeResult={codeResult}
                />
              </section>
            )}

            {activeSection === 'notes' && (
              <section className="project-workspace-section">
                <ProjectNotes
                  notes={notes}
                  notesLoading={notesLoading}
                  selectedNoteId={selectedNoteId}
                  startNewNote={startNewNote}
                  selectNote={selectNote}
                  saveNote={saveNote}
                  deleteNote={deleteNote}
                  title={title}
                  setTitle={setTitle}
                  content={content}
                  setContent={setContent}
                  saving={saving}
                  noteMessage={noteMessage}
                />
              </section>
            )}

            {activeSection === 'ai' && (
              <section className="project-workspace-section">
                <ProjectAIStudio
                  generateReadme={generateReadme}
                  readmeLoading={readmeLoading}
                  readmeMessage={readmeMessage}
                  readmeResult={readmeResult}
                  downloadReadme={downloadReadme}
                  runAI={runAI}
                  aiLoading={aiLoading}
                  aiResult={aiResult}
                  content={content}
                />
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProjectDetails
