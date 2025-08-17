import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'

export default function Home() {
  const { session, isLoading: authLoading, error: authError } = useAuth()
  const { manifest, manifestLoading, refreshManifest } = useContext(AppContext)
  
  const [currentBuild, setCurrentBuild] = useState(null)
  const [buildRequest, setBuildRequest] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [inventoryLoaded, setInventoryLoaded] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Handle authentication callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('auth') === 'success') {
      console.log('Authentication successful!')
      window.history.replaceState({}, document.title, '/')
      
      // Load manifest after successful login
      refreshManifest()
    }
    
    if (urlParams.get('error')) {
      setLoginError(decodeURIComponent(urlParams.get('error')))
      window.history.replaceState({}, document.title, '/')
    }
  }, [refreshManifest])

  // Load manifest only after login (with retry prevention)
  const [manifestAttempted, setManifestAttempted] = useState(false)
  
  useEffect(() => {
    if (session && !manifest && !manifestLoading && !manifestAttempted) {
      console.log('User logged in, loading manifest from GitHub...')
      setManifestAttempted(true)
      refreshManifest()
    }
  }, [session, manifest, manifestLoading, manifestAttempted, refreshManifest])

  // App loads immediately - no authentication required to view
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <h1>Casting Destiny v2</h1>
          <p className="tagline">AI-Powered Destiny 2 Build Optimization</p>
          
          {loginError && (
            <div className="error-message">
              <p>Login failed: {loginError}</p>
            </div>
          )}
          
          {authError && (
            <div className="error-message">
              <p>Authentication error: {authError}</p>
            </div>
          )}
          
          <button 
            className="bungie-login-btn"
            onClick={() => {
              console.log('Initiating Bungie OAuth...')
              window.location.href = '/api/auth/bungie-login'
            }}
          >
            <img src="/bungie-logo.png" alt="Bungie" />
            Sign in with Bungie.net
          </button>
          
          <div className="login-info">
            <p>Sign in to access:</p>
            <ul>
              <li>Your Destiny 2 inventory</li>
              <li>AI-powered build recommendations</li>
              <li>Stat optimization</li>
              <li>Loadout management</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Main app interface - only shown after login
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Casting Destiny v2</h1>
          <div className="user-info">
            {session.user?.avatar && (
              <img 
                src={session.user.avatar} 
                alt={session.user.displayName}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
            <span>{session.user?.displayName || 'Guardian'}</span>
            <button 
              className="logout-btn"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.reload()
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Manifest loading indicator */}
        {manifestLoading && (
          <div className="manifest-loading">
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p>Loading game data from GitHub cache...</p>
          </div>
        )}

        {/* Main interface */}
        <div className="build-interface">
          <div className="left-panel">
            <NaturalLanguageInput 
              onSubmit={setBuildRequest}
              disabled={!manifest}
              placeholder={!manifest ? "Waiting for game data..." : "Describe your ideal build..."}
            />
            
            {currentBuild && (
              <BuildDisplay 
                build={currentBuild}
                onExoticLock={setLockedExotic}
                lockedExotic={lockedExotic}
              />
            )}
          </div>

          <div className="right-panel">
            <button 
              className="inventory-toggle"
              onClick={() => setShowInventory(!showInventory)}
              disabled={!manifest}
            >
              {showInventory ? 'Hide' : 'Show'} Inventory
            </button>
            
            {showInventory && (
              <UserInventory 
                session={session}
                manifest={manifest}
                onItemSelect={(item) => console.log('Selected:', item)}
                onLoadComplete={() => setInventoryLoaded(true)}
              />
            )}
          </div>
        </div>

        {/* Status indicators */}
        <div className="status-bar">
          <div className="status-item">
            <span className={`status-dot ${manifest ? 'active' : 'inactive'}`}></span>
            <span>Game Data: {manifest ? 'Ready' : 'Not Loaded'}</span>
          </div>
          <div className="status-item">
            <span className={`status-dot ${inventoryLoaded ? 'active' : 'inactive'}`}></span>
            <span>Inventory: {inventoryLoaded ? 'Loaded' : 'Not Loaded'}</span>
          </div>
        </div>
      </main>
    </div>
  )
}