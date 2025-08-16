import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'
import FriendSystem from '../components/FriendSystem'

export default function Home() {
  const { session, isLoading: authLoading } = useAuth()
  const { intelligenceStatus, manifest } = useContext(AppContext)
  const [buildRequest, setBuildRequest] = useState('')
  const [currentBuild, setCurrentBuild] = useState(null)
  const [showInventory, setShowInventory] = useState(false)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [authError, setAuthError] = useState('')

  // Check for auth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const authSuccess = urlParams.get('auth')
    
    if (error) {
      setAuthError(decodeURIComponent(error))
      // Clean URL
      window.history.replaceState({}, document.title, '/')
    }
    
    if (authSuccess === 'success') {
      console.log('Authentication successful!')
      // Clean URL
      window.history.replaceState({}, document.title, '/')
    }
  }, [])

  // Show loading screen if auth is loading
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
          
          {authError && (
            <div className="error-message">
              <strong>Login Error:</strong> {authError}
              <button 
                onClick={() => setAuthError('')}
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

  const isIntelligenceReady = () => {
    return intelligenceStatus?.isInitialized && !intelligenceStatus?.isLoading
  }

  return (
    <div className="home-container">
      <div className="main-content">
        {/* Intelligence System Status */}
        {intelligenceStatus?.error && (
          <div className="system-warning">
            <span className="warning-icon">⚠️</span>
            <span>Running in basic mode. Some AI features may be unavailable.</span>
          </div>
        )}

        {!currentBuild ? (
          <>
            {/* Build Creator Section */}
            <div className="build-creator">
              <h2>Create Your Build</h2>
              
              {isIntelligenceReady() ? (
                <NaturalLanguageInput
                  value={buildRequest}
                  onChange={setBuildRequest}
                  onSubmit={handleBuildGenerated}
                  lockedExotic={lockedExotic}
                  disabled={!manifest}
                />
              ) : (
                <div className="basic-build-creator">
                  <p>AI features are loading. You can still browse your inventory.</p>
                </div>
              )}
              
              <div className="quick-actions">
                <button 
                  onClick={handleInventoryToggle}
                  className="inventory-btn"
                >
                  {showInventory ? 'Hide' : 'Show'} Inventory
                </button>
              </div>
            </div>

            {/* Inventory Display */}
            {showInventory && (
              <div className="inventory-section">
                <UserInventory 
                  onExoticLocked={handleExoticLocked}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Build Display */}
            <BuildDisplay 
              build={currentBuild}
              onNewBuild={handleNewSearch}
            />
          </>
        )}
      </div>

      {/* Friends Sidebar */}
      <div className="friends-sidebar">
        <FriendSystem />
      </div>
    </div>
  )
}