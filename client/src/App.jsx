import { useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom'

import './App.css'
import API from './api'

import DashboardLayout from './components/DashboardLayout'
import ProjectDetails from './components/ProjectDetails'
import PublicProject from './pages/PublicProject'

import Overview from './pages/dashboard/Overview'
import MyProjects from './pages/dashboard/MyProjects'
import Settings from './pages/dashboard/Settings'

function App() {
  const navigate = useNavigate()

  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || ''
  )

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('token'))
  )

  const [showPassword, setShowPassword] = useState(false)

  const clearForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  const switchTab = (loginMode) => {
    setIsLogin(loginMode)
    clearForm()
    setMessage('')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken('')
    setIsLoggedIn(false)
    setIsLogin(true)
    clearForm()
    setMessage('')
    navigate('/', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('Please wait...')

    try {
      const endpoint = isLogin ? 'login' : 'register'

      const response = await fetch(
        `${API}/auth/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : { name, email, password }
          ),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      if (isLogin) {
        if (!data.token) {
          throw new Error(
            'Login succeeded, but no token was returned.'
          )
        }

        localStorage.setItem('token', data.token)
        setToken(data.token)
        setIsLoggedIn(true)
        setMessage(data.message || 'Login successful!')

        navigate('/dashboard', { replace: true })
      } else {
        setMessage(data.message || 'Account created successfully!')
        setIsLogin(true)
        clearForm()
      }
    } catch (error) {
      setMessage(
        error.message || 'Unable to connect to the server'
      )
    }
  }

  const authPage = (
    <main className="auth-page">
      <section className="auth-card">
        <h1>CollabSphere</h1>
        <p className="subtitle">
          Your space to build together.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => switchTab(true)}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => switchTab(false)}
          >
            Register
          </button>
        </div>

        <form
          key={isLogin ? 'login-form' : 'register-form'}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {!isLogin && (
            <label>
              Full name
              <input
                type="text"
                name="register-name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name={isLogin ? 'login-email' : 'register-email'}
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name={
                  isLogin ? 'login-password' : 'register-password'
                }
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button className="submit-button" type="submit">
            {isLogin ? 'Login' : 'Create account'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  )

  return (
    <Routes>
      <Route
        path="/public/projects/:token"
        element={<PublicProject />}
      />

      <Route
        path="/"
        element={
          isLoggedIn && token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            authPage
          )
        }
      />

      {/* Protected dashboard layout */}
      <Route
        element={
          isLoggedIn && token ? (
            <DashboardLayout onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/projects" element={<MyProjects />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Individual project workspace */}
      <Route
        path="/projects/:id"
        element={
          isLoggedIn && token ? (
            <ProjectDetails />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App
