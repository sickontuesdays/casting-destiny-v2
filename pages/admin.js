import { useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import AdminPanel from '../components/AdminPanel'

export default function AdminPage() {
  const { session, isLoading } = useAuth()
  const { manifest } = useContext(AppContext)

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

      <style jsx>{`
        .loading-screen, .auth-required {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 107, 53, 0.3);
          border-radius: 50%;
          border-top-color: #ff6b35;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-container {
          text-align: center;
          padding: 40px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          border: 1px solid #333;
        }

        .auth-container h1 {
          color: #ff6b35;
          margin-bottom: 20px;
        }

        .auth-container p {
          color: #999;
          margin-bottom: 30px;
        }

        .bungie-login-btn {
          background: #ff6b35;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .bungie-login-btn:hover {
          background: #ff7f4f;
          transform: translateY(-2px);
        }

        .admin-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
        }

        .page-header {
          background: rgba(0, 0, 0, 0.5);
          padding: 24px;
          border-bottom: 2px solid #ff6b35;
        }

        .page-header h1 {
          margin: 0;
          color: #ff6b35;
        }

        .page-header p {
          margin: 8px 0 0;
          color: #999;
        }

        .admin-content {
          padding: 20px;
        }
      `}</style>
    </div>
  )
}