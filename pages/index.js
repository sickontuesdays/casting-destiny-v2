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
      // Clean URL
      window.history.replaceState({}, document.title, '/')
      
      // Load manifest from GitHub after successful login
      if (!manifest && !manifestLoading) {
        refreshManifest()
      }
    }
    
    if (urlParams.get('error')) {
      setLoginError(decodeURIComponent(urlParams.get('error')))
      // Clean URL
      window.history.replaceState({}, document.title, '/')
    }
  }, [])

  // Load user data after authentication
  useEffect(() => {
    if (session && !inventoryLoaded && !manifestLoading) {
      // Load manifest from GitHub if not already loaded
      if (!manifest) {
        refreshManifest()
      }
      setInventoryLoaded(true)
    }
  }, [session, inventoryLoaded, manifest, manifestLoading])

  // Show loading only during auth check
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login screen for unauthenticated users
  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="app-header">
            <h1>Casting Destiny v2</h1>
            <p className="app-tagline">AI-Powered Build Optimization for Destiny 2</p>
          </div>
          
          <div className="features-preview">
            <h3>What's New in v2</h3>
            <ul>
              <li>🧠 Natural Language Build Requests</li>
              <li>⚡ Advanced Synergy Analysis</li>
              <li>🎯 Activity-Specific Optimization</li>
              <li>👥 Social Build Sharing</li>
              <li>📊 Enhanced Performance Scoring</li>
            </ul>
          </div>
          
          {(loginError || authError) && (
            <div className="error-message">
              <strong>Login Error:</strong> {loginError || authError}
              <button 
                onClick={() => {
                  setLoginError('')
                }}
                className="error-close"
              >
                ×
              </button>
            </div>
          )}
          
          <button 
            className="bungie-login-btn"
            onClick={() => window.location.href = '/api/auth/bungie-login'}
          >
            <img src="/bungie-logo.svg" alt="Bungie" />
            Sign in with Bungie.net
          </button>
          
          <div className="disclaimer">
            <p>
              This app requires access to your Destiny 2 character data to generate 
              personalized build recommendations.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main app interface for authenticated users
  const handleBuildGenerated = (build) => {
    setCurrentBuild(build)
    setShowInventory(false)
  }

  const handleNewSearch = () => {
    setCurrentBuild(null)
    setBuildRequest('')
    setLockedExotic(null)
  }

  const handleInventoryToggle = () => {
    setShowInventory(!showInventory)
  }

  const handleExoticLocked = (exotic) => {
    setLockedExotic(exotic)
    setShowInventory(false)
  }

  return (
    <div className="home-container">
      <div className="main-content">
        {/* User info bar */}
        <div className="user-bar">
          <div className="user-info">
            <img 
              src={session.user.avatar || '/default-guardian.png'} 
              alt={session.user.displayName}
              className="user-avatar"
            />
            <span className="user-name">{session.user.displayName}</span>
            <span className="user-platform">({session.user.platforms?.[0] || 'Unknown'})</span>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={handleInventoryToggle}
              className="inventory-btn"
              disabled={manifestLoading}
            >
              {showInventory ? 'Hide' : 'Show'} Inventory
            </button>
            
            <a href="/admin" className="admin-link">
              Admin Panel
            </a>
            
            <button 
              onClick={() => window.location.href = '/api/auth/logout'}
              className="logout-btn"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Manifest status */}
        {!manifest && !manifestLoading && (
          <div className="manifest-warning">
            <span className="warning-icon">⚠️</span>
            <span>Manifest not loaded. Visit the Admin Panel to download the manifest.</span>
            <a href="/admin" className="warning-link">Go to Admin Panel</a>
          </div>
        )}

        {manifestLoading && (
          <div className="manifest-loading">
            <div className="loading-spinner small"></div>
            <span>Loading Destiny 2 data...</span>
          </div>
        )}

        {/* Build interface */}
        <div className="build-interface">
          {!currentBuild ? (
            <div className="build-creator">
              <h2>Create Your Perfect Build</h2>
              
              {lockedExotic && (
                <div className="locked-exotic">
                  <span>Building around: </span>
                  <strong>{lockedExotic.name}</strong>
                  <button onClick={() => setLockedExotic(null)}>×</button>
                </div>
              )}
              
              <NaturalLanguageInput
                onBuildGenerated={handleBuildGenerated}
                value={buildRequest}
                onChange={setBuildRequest}
                lockedExotic={lockedExotic}
                disabled={!manifest}
                placeholder={!manifest ? "Please load manifest from Admin Panel first..." : "Describe your ideal build..."}
              />
              
              <div className="quick-actions">
                <button 
                  onClick={() => setBuildRequest("Create a DPS build for raid boss damage")}
                  disabled={!manifest}
                >
                  Raid DPS
                </button>
                <button 
                  onClick={() => setBuildRequest("Make me tanky for grandmaster nightfalls")}
                  disabled={!manifest}
                >
                  GM Tank
                </button>
                <button 
                  onClick={() => setBuildRequest("PvP build focused on movement and map control")}
                  disabled={!manifest}
                >
                  PvP Control
                </button>
                <button 
                  onClick={() => setBuildRequest("Ability spam build with fast cooldowns")}
                  disabled={!manifest}
                >
                  Ability Spam
                </button>
              </div>
            </div>
          ) : (
            <div className="build-results">
              <BuildDisplay
                build={currentBuild}
                onNewSearch={handleNewSearch}
                onSave={() => console.log('Save build')}
                onShare={() => console.log('Share build')}
              />
            </div>
          )}
        </div>

        {/* Inventory panel */}
        {showInventory && session && (
          <div className="inventory-panel">
            <UserInventory
              session={session}
              onExoticLocked={handleExoticLocked}
              onClose={() => setShowInventory(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}