import { useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import AdminPanel from '../components/AdminPanel'

export default function AdminPage() {
  const { session, isLoading } = useAuth()
  const { intelligenceStatus } = useContext(AppContext)

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-required">
        <div className="auth-container">
          <h1>Authentication Required</h1>
          <p>Please sign in to access the admin panel.</p>
          <button 
            className="bungie-login-btn"
            onClick={() => window.location.href = '/api/auth/bungie-login'}
          >
            Sign in with Bungie.net
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Administration</h1>
        <p>Monitor and manage the Casting Destiny v2 system</p>
      </div>

      <div className="admin-content">
        <AdminPanel />
      </div>
    </div>
  )
}