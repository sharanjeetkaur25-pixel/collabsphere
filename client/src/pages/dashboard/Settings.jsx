import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import API from '../../api'

function Settings() {
  const { user } = useOutletContext()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const token = localStorage.getItem('token')

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileMessage('')
    setSavingProfile(true)

    try {
      const response = await fetch(
          `${API}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, email }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.')
      }

      setProfileMessage(data.message || 'Profile updated successfully.')
    } catch (error) {
      setProfileMessage(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMessage('')

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        'New password must contain at least 8 characters.'
      )
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch(
          `${API}/auth/change-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to change password.')
      }

      setPasswordMessage(
        data.message || 'Password changed successfully.'
      )

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      setPasswordMessage(error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <h1>Settings</h1>
        <p>Manage your profile and account security.</p>
      </div>

      {/* Profile Information */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <h2>Profile Information</h2>
          <p>Update your personal information.</p>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <label className="settings-label">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </label>

          <label className="settings-label">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <button
            type="submit"
            className="settings-button"
            disabled={savingProfile}
          >
            {savingProfile ? 'Saving...' : 'Save changes'}
          </button>

          {profileMessage && (
            <p className="settings-message">{profileMessage}</p>
          )}
        </form>
      </section>

      {/* Account Security */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <h2>Account Security</h2>
          <p>Change your password to keep your account secure.</p>
        </div>

        <form onSubmit={handlePasswordChange}>
          {/* Current Password */}
          <label className="settings-label">
            Current password

            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowCurrentPassword((current) => !current)
                }
              >
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {/* New Password */}
          <label className="settings-label">
            New password

            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowNewPassword((current) => !current)
                }
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {/* Confirm New Password */}
          <label className="settings-label">
            Confirm new password

            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="settings-button"
            disabled={changingPassword}
          >
            {changingPassword ? 'Updating...' : 'Change password'}
          </button>

          {passwordMessage && (
            <p className="settings-message">{passwordMessage}</p>
          )}
        </form>
      </section>
    </div>
  )
}

export default Settings
