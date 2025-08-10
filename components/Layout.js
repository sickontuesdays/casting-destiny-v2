import { useState } from 'react'
import { useAuth } from '../lib/useAuth'
import FriendSystem from './FriendSystem'

export default function Layout({ children }) {
  const { session, isLoading, login, logout } = useAuth()
  const [showFriends, setShowFriends] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const toggleFriends = () => {
    setShowFriends(!showFriends)
  }

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">
              <span className="title-main">Casting Destiny</span>
              <span className="title-version">v2</span>
            </h1>
          </div>

          <div className="header-center">
            <nav className={`main-nav ${showMobileMenu ? 'mobile-open' : ''}`}>
              <a href="/" className="nav-link">Build Creator</a>
              <a href="/builds" className="nav-link">My Builds</a>
              <a href="/admin" className="nav-link">Admin</a>
            </nav>
          </div>

          <div className="header-right">
            {isLoading ? (
              <div className="auth-loading">
                <span>Loading...</span>
              </div>
            ) : session?.user ? (
              <div className="user-menu">
                <div className="user-info">
                  <img 
                    src={session.user.avatar || '/default-avatar.png'} 
                    alt="User Avatar"
                    className="user-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png'
                    }}
                  />
                  <div className="user-details">
                    <span className="user-name">{session.user.displayName}</span>
                    <span className="user-code">#{session.user.displayNameCode}</span>
                  </div>
                </div>
                
                <div className="user-actions">
                  <button 
                    onClick={toggleFriends}
                    className={`friends-toggle ${showFriends ? 'active' : ''}`}
                    title="Toggle Friends"
                  >
                    👥 Friends
                  </button>
                  
                  <button 
                    onClick={logout}
                    className="logout-btn"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-actions">
                <button 
                  onClick={login}
                  className="login-btn"
                >
                  Sign in with Bungie
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-layout">
        {/* Sidebar for Friends */}
        {session?.user && (
          <aside className={`friends-sidebar ${showFriends ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Friends & Social</h3>
              <button 
                onClick={toggleFriends}
                className="close-sidebar"
              >
                ×
              </button>
            </div>
            <div className="sidebar-content">
              <FriendSystem />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`main-content ${showFriends ? 'sidebar-open' : ''}`}>
          {children}
        </main>

        {/* Overlay for mobile */}
        {showFriends && (
          <div 
            className="sidebar-overlay"
            onClick={toggleFriends}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Casting Destiny v2</h4>
            <p>AI-powered build creator for Destiny 2</p>
          </div>
          
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Intelligent Build Generation</li>
              <li>Synergy Analysis</li>
              <li>Stat Optimization</li>
              <li>Natural Language Processing</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>About</h4>
            <p>
              This app is not affiliated with or endorsed by Bungie, Inc. 
              Destiny is a trademark of Bungie, Inc.
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Casting Destiny v2. Built with Next.js and the Bungie API.</p>
          {session?.user && (
            <div className="user-status">
              <span>Signed in as {session.user.displayName}</span>
              <span className="connection-status">🟢 Connected</span>
            </div>
          )}
        </div>
      </footer>

      {/* Development/Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <pre>
              {JSON.stringify({
                isLoading,
                hasSession: !!session,
                user: session?.user ? {
                  id: session.user.membershipId,
                  name: session.user.displayName,
                  type: session.user.membershipType
                } : null,
                showFriends,
                showMobileMenu
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}