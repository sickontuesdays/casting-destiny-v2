import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import AdminPanel from '../components/AdminPanel'

export default function Admin() {
  const { session } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setIsAuthorized(true)
        setError('')
      } else {
        setError('Invalid admin password')
      }
    } catch (error) {
      setError('Authentication failed')
    }
  }

  if (!session) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Access</h1>
          <p>Please sign in with Bungie.net first</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Panel Access</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Admin Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-password-input"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="admin-login-btn">
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Casting Destiny v2 - Admin Panel</h1>
        <p>Manage manifest data, seasonal artifacts, and system settings</p>
      </div>
      <AdminPanel />
    </div>
  )
}