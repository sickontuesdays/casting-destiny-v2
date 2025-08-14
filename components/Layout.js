import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import FriendSystem from './FriendSystem'

export default function Layout({ children }) {
  const { session, isLoading, logout } = useAuth()
  const [showFriends, setShowFriends] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  const toggleFriends = () => {
    setShowFriends(!showFriends)
  }

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { href: '/', label: 'Build Creator', icon: '🏗️' },
    { href: '/builds', label: 'My Builds', icon: '📋' },
    { href: '/admin', label: 'Admin', icon: '⚙️' }
  ]

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              ☰
            </button>
            
            <div className="app-title" onClick={() => router.push('/')}>
              <h1>
                <span className="title-main">Casting Destiny</span>
                <span className="title-version">v2</span>
              </h1>
              <span className="title-subtitle">AI-Powered Build Optimization</span>
            </div>
          </div>

          <div className="header-center">
            <nav className={`main-nav ${showMobileMenu ? 'mobile-open' : ''}`}>
              {navItems.map(item => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className={`nav-link ${router.pathname === item.href ? 'active' : ''}`}
                  onClick={toggleMobileMenu}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="header-right">
            {isLoading ? (
              <div className="auth-loading">
                <div className="loading-spinner small"></div>
                <span>Loading...</span>
              </div>
            ) : session?.user ? (
              <div className="user-menu">
                <button 
                  className="user-menu-trigger"
                  onClick={toggleUserMenu}
                >
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
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span>{session.user.displayName}</span>
                      <span className="user-membership">
                        {session.user.membershipType === 1 ? 'Xbox' :
                         session.user.membershipType === 2 ? 'PlayStation' :
                         session.user.membershipType === 3 ? 'Steam' :
                         session.user.membershipType === 6 ? 'Epic Games' : 'Bungie'}
                      </span>
                    </div>
                    
                    <div className="dropdown-actions">
                      <button 
                        onClick={() => {
                          toggleFriends()
                          setShowUserMenu(false)
                        }}
                        className="dropdown-item"
                      >
                        <span className="item-icon">👥</span>
                        <span>Friends</span>
                        {showFriends && <span className="active-indicator">●</span>}
                      </button>
                      
                      <button 
                        onClick={() => {
                          router.push('/builds')
                          setShowUserMenu(false)
                        }}
                        className="dropdown-item"
                      >
                        <span className="item-icon">📋</span>
                        <span>My Builds</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          router.push('/admin')
                          setShowUserMenu(false)
                        }}
                        className="dropdown-item"
                      >
                        <span className="item-icon">⚙️</span>
                        <span>Settings</span>
                      </button>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button 
                        onClick={() => {
                          handleLogout()
                          setShowUserMenu(false)
                        }}
                        className="dropdown-item logout"
                      >
                        <span className="item-icon">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-actions">
                <button 
                  className="login-btn"
                  onClick={() => window.location.href = '/api/auth/bungie-login'}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="mobile-menu-overlay"
            onClick={toggleMobileMenu}
          />
        )}
      </header>

      {/* Friends System Sidebar */}
      {showFriends && session?.user && (
        <div className="friends-sidebar">
          <div className="friends-header">
            <h3>Friends</h3>
            <button 
              onClick={toggleFriends}
              className="close-friends"
            >
              ×
            </button>
          </div>
          <FriendSystem />
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-links">
              <a href="/privacy" className="footer-link">Privacy Policy</a>
              <a href="/terms" className="footer-link">Terms of Service</a>
              <a href="/about" className="footer-link">About</a>
              <a href="https://github.com/yourusername/casting-destiny-v2" target="_blank" rel="noopener noreferrer" className="footer-link">
                GitHub
              </a>
            </div>
            
            <div className="footer-disclaimer">
              <p>
                This app is not affiliated with or endorsed by Bungie, Inc. 
                Destiny is a trademark of Bungie, Inc.
              </p>
            </div>
          </div>
          
          <div className="footer-status">
            {session?.user && (
              <div className="user-status">
                <span>Signed in as {session.user.displayName}</span>
                <span className="connection-status">🟢 Connected</span>
              </div>
            )}
            
            <div className="app-version">
              <span>Casting Destiny v2.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Click outside handlers */}
      {showUserMenu && (
        <div 
          className="dropdown-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Development Debug Info */}
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
                showMobileMenu,
                currentPath: router.pathname
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}