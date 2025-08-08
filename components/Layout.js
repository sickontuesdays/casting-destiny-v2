import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/useAuth'
import FriendSystem from './FriendSystem'

export default function Layout({ children }) {
  const { session, signOut } = useAuth()
  const [showFriends, setShowFriends] = useState(false)

  return (
    <div className="layout">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <Link href="/" className="logo">
              <h1>Casting Destiny v2</h1>
            </Link>
          </div>
          
          {session && (
            <nav className="main-nav">
              <Link href="/" className="nav-link">
                Build Creator
              </Link>
              <button 
                className="nav-link friends-toggle"
                onClick={() => setShowFriends(!showFriends)}
              >
                Friends
              </button>
              <Link href="/admin" className="nav-link admin-link">
                Admin
              </Link>
            </nav>
          )}

          {session && (
            <div className="user-section">
              <div className="user-info">
                <span className="username">{session.user.name}</span>
                <span className="membership-id">#{session.user.id}</span>
              </div>
              <button 
                className="signout-btn"
                onClick={() => signOut()}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      {session && showFriends && (
        <div className="friends-overlay">
          <div className="friends-panel">
            <div className="friends-header">
              <h3>Friends & Clan</h3>
              <button 
                className="close-friends"
                onClick={() => setShowFriends(false)}
              >
                ×
              </button>
            </div>
            <FriendSystem />
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-content">
          <p>Casting Destiny v2 - Destiny 2 Build Crafting Tool</p>
          <p>Not affiliated with Bungie. Destiny 2 is a trademark of Bungie, Inc.</p>
        </div>
      </footer>
    </div>
  )
}