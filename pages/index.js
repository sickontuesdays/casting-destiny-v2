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
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <div className="login-actions">
            <button 
              className="login-btn primary"
              onClick={() => window.location.href = '/api/auth/bungie-login'}
            >
              Sign in with Bungie.net
            </button>
          </div>

          <div className="login-info">
            <p>Connect your Bungie.net account to:</p>
            <ul>
              <li>✓ Access your Destiny 2 inventory</li>
              <li>✓ Generate personalized builds</li>
              <li>✓ Save and share your creations</li>
              <li>✓ Connect with friends</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Main app view for authenticated users
  return (
    <div className="home-page">
      {/* System Status Banner */}
      {manifestLoading && (
        <div className="intelligence-loading-banner">
          <div className="loading-content">
            <div className="loading-spinner small"></div>
            <span>Loading game data from cache...</span>
          </div>
        </div>
      )}

      {/* Main Build Creation Area */}
      <div className="home-container">
        <div className="build-creation-section">
          <div className="creation-panel">
            <div className="panel-header">
              <h2>Build Creator</h2>
              <p>Describe your ideal build and let AI intelligence create it for you</p>
            </div>

            <NaturalLanguageInput 
              onBuildGenerated={setCurrentBuild}
              disabled={!manifest}
              lockedExotic={lockedExotic}
              placeholder={!manifest ? 
                "Waiting for game data..." : "Describe your ideal build..."}
            />
            
            {currentBuild && (
              <BuildDisplay 
                build={currentBuild}
                onExoticLock={setLockedExotic}
                lockedExotic={lockedExotic}
              />
            )}
          </div>

          {/* Optional Inventory Panel (Toggleable) */}
          {session && (
            <div className="inventory-section">
              <div className="inventory-controls">
                <button 
                  className={`inventory-toggle ${showInventory ? 'active' : ''}`}
                  onClick={() => setShowInventory(!showInventory)}
                  disabled={!manifest}
                >
                  <span className="toggle-icon">{showInventory ? '👁️‍🗨️' : '👁️'}</span>
                  <span>{showInventory ? 'Hide' : 'Show'} Inventory</span>
                </button>
              </div>
              
              {showInventory && (
                <div className="inventory-panel">
                  <UserInventory 
                    session={session}
                    manifest={manifest}
                    onItemSelect={(item) => console.log('Selected:', item)}
                    onLoadComplete={() => setInventoryLoaded(true)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="status-bar">
          <div className="status-item">
            <span className={`status-dot ${manifest ? 'active' : 'inactive'}`}></span>
            <span>Game Data: {manifest ? 'Ready' : 'Loading...'}</span>
          </div>
          <div className="status-item">
            <span className={`status-dot ${inventoryLoaded ? 'active' : 'inactive'}`}></span>
            <span>Inventory: {inventoryLoaded ? 'Loaded' : 'Not Loaded'}</span>
          </div>
          {session && (
            <div className="status-item">
              <span className="status-dot active"></span>
              <span>Friends: Connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}