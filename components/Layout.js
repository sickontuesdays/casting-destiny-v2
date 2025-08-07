import { useState } from 'react'
import Link from 'next/link'
import FriendSystem from './FriendSystem'

export default function Layout({ children }) {
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
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      {showFriends && (
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