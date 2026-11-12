import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import API from '../api'

function PublicProject() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProject() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API}/public/projects/${encodeURIComponent(token)}`,
          { signal: controller.signal }
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load project.')
        }

        setData(result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load project.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProject()
    return () => controller.abort()
  }, [token])

  if (loading) {
    return <main className="dashboard"><p>Loading public project...</p></main>
  }

  if (error || !data?.project) {
    return (
      <main className="dashboard">
        <h1>Public Project Unavailable</h1>
        <p>{error || 'Project not found.'}</p>
        <Link to="/">Go to CollabSphere</Link>
      </main>
    )
  }

  const { project, notes = [], files = [] } = data

  return (
    <main className="dashboard">
      <Link to="/">CollabSphere</Link>

      <section className="project-details">
        <h1>{project.name}</h1>
        <p>{project.description || 'No description provided.'}</p>
        <p><strong>Status:</strong> {project.status}</p>
        <p><strong>Owner:</strong> {project.owner?.name || 'Project owner'}</p>

        <hr />
        <h2>Shared Notes</h2>

        {notes.length === 0 ? (
          <p>No notes available.</p>
        ) : notes.map((note) => (
          <article key={note._id}>
            <h3>{note.title}</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content || ''}
            </ReactMarkdown>
          </article>
        ))}

        <hr />
        <h2>File Information</h2>

        {files.length === 0 ? (
          <p>No files available.</p>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file._id}>
                {file.originalName} — {file.mimeType || 'Unknown type'}
                {typeof file.size === 'number'
                  ? ` (${(file.size / 1024).toFixed(1)} KB)`
                  : ''}
              </li>
            ))}
          </ul>
        )}

        <p>This is a read-only public project page.</p>
      </section>
    </main>
  )
}

export default PublicProject
