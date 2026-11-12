import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import '../App.css'
import API from '../api'

function DashboardLayout({ onLogout }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectError, setProjectError] = useState('')

  const refreshProjects = useCallback(async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setProjectsLoading(false)
      return
    }

    setProjectsLoading(true)
    setProjectError('')

    try {
      const response = await fetch(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects.')
      }

      setProjects(data.projects || [])
    } catch (err) {
      setProjectError(err.message || 'Unable to load projects.')
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setError('Please log in to access your dashboard.')
      setLoading(false)
      setProjectsLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load your profile.')
        }

        setUser(data.user || data)
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
    refreshProjects()
  }, [refreshProjects])

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>CollabSphere</h1>
          <p className="subtitle">Loading your dashboard...</p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>CollabSphere</h1>
          <p className="message">{error}</p>
          <button
            className="submit-button"
            type="button"
            onClick={onLogout}
          >
            Back to Login
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-top">
            <svg
              className="brand-emblem"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M24 3 C20 10 20 14 24 19 C28 14 28 10 24 3Z" stroke="currentColor" />
              <path d="M24 45 C20 38 20 34 24 29 C28 34 28 38 24 45Z" stroke="currentColor" />
              <path d="M3 24 C10 20 14 20 19 24 C14 28 10 28 3 24Z" stroke="currentColor" />
              <path d="M45 24 C38 20 34 20 29 24 C34 28 38 28 45 24Z" stroke="currentColor" />
              <path d="M9 9 C17 10 21 14 24 21 C17 20 13 16 9 9Z" stroke="currentColor" />
              <path d="M39 9 C31 10 27 14 24 21 C31 20 35 16 39 9Z" stroke="currentColor" />
              <path d="M9 39 C17 38 21 34 24 27 C17 28 13 32 9 39Z" stroke="currentColor" />
              <path d="M39 39 C31 38 27 34 24 27 C31 28 35 32 39 39Z" stroke="currentColor" />
              <circle cx="24" cy="24" r="4" stroke="currentColor" />
            </svg>

            <h1>
              Collab<span>Sphere</span>
            </h1>
          </div>

          <p className="sidebar-tagline">BUILD · COLLABORATE · GROW</p>
        </div>

        <nav className="dashboard-nav">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            My Projects
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="submit-button logout-button"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

          <p className="sidebar-quote">
            Better together, further always.
          </p>
        </div>
      </aside>

      <section className="dashboard-main">
        <Outlet
          context={{
            user,
            projects,
            setProjects,
            projectsLoading,
            projectError,
            setProjectError,
            refreshProjects,
          }}
        />
      </section>
    </main>
  )
}

export default DashboardLayout
