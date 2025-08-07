import { useState, useEffect } from 'react'
import AdminPanel from '../components/AdminPanel'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    try {
      // Check for custom session cookie
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';')
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('bungie_session='))
        
        if (sessionCookie) {
          const sessionData = sessionCookie.split('=')[1]
          const decodedSession = JSON.parse(atob(sessionData))
          
          // Check if session is still valid
          if (decodedSession.expiresAt > Date.now()) {
            setSession(decodedSession)
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setSessionLoading(false)
    }
  }

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

  if (sessionLoading) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Admin Access</h1>
          <p>Please sign in with Bungie.net first</p>
          <a href="/" className="bungie-login-btn">
            Go to Login
          </a>
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