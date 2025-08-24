import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import FriendSystem from './FriendSystem'

export default function Layout({ children }) {
  const { session, isLoading, logout } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

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
    { href: '/inventory', label: 'Inventory', icon: '🎒' },
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
                      src={session.user.iconPath || '/default-avatar.png'} 
                      alt="Profile"
                      className="user-avatar"
                    />
                    <div className="user-details">
                      <span className="user-name">{session.user.displayName}</span>
                      <span className="user-code">#{session.user.membershipId?.slice(-4)}</span>
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

      {/* Three Column Layout */}
      <div className="app-container">
        {/* Main Content - Center Column */}
        <main className="main-content">
          {children}
        </main>

        {/* Friends Column - Right Side (Always Visible When Logged In) */}
        {session?.user && (
          <aside className="friends-column">
            <div className="friends-column-header">
              <h3>Friends</h3>
            </div>
            <div className="friends-column-content">
              <FriendSystem />
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-info">
              <p>&copy; 2024 Casting Destiny v2. Built for Guardians.</p>
            </div>
            <div className="footer-status">
              <span className="connection-status">Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}