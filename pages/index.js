import { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import BuildCreator from '../components/BuildCreator'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'

export default function Home() {
  const { session, isLoading: authLoading } = useAuth()
  const { intelligenceStatus, isIntelligenceReady } = useContext(AppContext)
  const [currentBuild, setCurrentBuild] = useState(null)
  const [buildRequest, setBuildRequest] = useState('')
  const [useInventoryOnly, setUseInventoryOnly] = useState(false)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [authError, setAuthError] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const router = useRouter()

  // Check for authentication errors in URL
  useEffect(() => {
    if (router.query.error) {
      setAuthError(router.query.error)
      // Clear error from URL
      router.replace('/', undefined, { shallow: true })
    }
  }, [router.query.error])

  // Show loading screen while systems initialize
  if (authLoading || intelligenceStatus.isLoading) {
    return (
      <div className="loading-screen">
        <div className="destiny-loader">
          <div className="loader-spinner"></div>
        </div>
        <div className="loading-text">
          <h2>Casting Destiny v2</h2>
          <p>
            {authLoading 
              ? 'Connecting to Bungie...' 
              : 'Initializing AI Intelligence System...'
            }
          </p>
          {intelligenceStatus.features.length > 0 && (
            <div className="loading-features">
              <small>Loading: {intelligenceStatus.features.join(', ')}</small>
            </div>
          )}
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

  return (
    <div className="home-container">
      <div className="main-content">
        {/* Intelligence System Status */}
        {!isIntelligenceReady() && (
          <div className="system-warning">
            <span className="warning-icon">⚠️</span>
            <span>AI features are currently unavailable. Basic functionality is still available.</span>
          </div>
        )}

        {!currentBuild ? (
          <div className="build-creation-view">
            {/* Main Build Creation Interface */}
            <div className="creation-panel">
              <div className="panel-header">
                <h2>Create Your Perfect Build</h2>
                <p>Describe what you want or use the advanced creator</p>
              </div>

              {/* Natural Language Input */}
              <div className="input-section">
                <NaturalLanguageInput
                  onBuildGenerated={handleBuildGenerated}
                  buildRequest={buildRequest}
                  setBuildRequest={setBuildRequest}
                  useInventoryOnly={useInventoryOnly}
                  lockedExotic={lockedExotic}
                  disabled={!isIntelligenceReady()}
                />
              </div>

              {/* Quick Options */}
              <div className="quick-options">
                <div className="option-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useInventoryOnly}
                      onChange={(e) => setUseInventoryOnly(e.target.checked)}
                    />
                    <span>Use only items in my inventory</span>
                  </label>
                </div>

                <button 
                  className="inventory-btn"
                  onClick={handleInventoryToggle}
                >
                  {showInventory ? 'Hide Inventory' : 'View My Inventory'}
                </button>
              </div>

              {/* Locked Exotic Display */}
              {lockedExotic && (
                <div className="locked-exotic">
                  <span>🔒 Build will include: {lockedExotic.name}</span>
                  <button onClick={() => setLockedExotic(null)}>Remove</button>
                </div>
              )}

              {/* Advanced Creator Fallback */}
              <div className="advanced-creator-section">
                <details>
                  <summary>Advanced Build Creator</summary>
                  <BuildCreator
                    onBuildGenerated={handleBuildGenerated}
                    useInventoryOnly={useInventoryOnly}
                    lockedExotic={lockedExotic}
                  />
                </details>
              </div>
            </div>

            {/* Inventory Panel */}
            {showInventory && (
              <div className="inventory-panel">
                <UserInventory onExoticLocked={handleExoticLocked} />
              </div>
            )}
          </div>
        ) : (
          /* Build Display View */
          <div className="build-display-view">
            <BuildDisplay 
              build={currentBuild} 
              onNewSearch={handleNewSearch}
            />
          </div>
        )}
      </div>

      {/* Quick Actions Sidebar */}
      <aside className="quick-actions">
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => router.push('/builds')}
            title="My Saved Builds"
          >
            📋
          </button>
          <button 
            className="action-btn"
            onClick={handleInventoryToggle}
            title="Toggle Inventory"
          >
            🎒
          </button>
          <button 
            className="action-btn"
            onClick={() => router.push('/admin')}
            title="Admin Panel"
          >
            ⚙️
          </button>
        </div>
      </aside>
    </div>
  )
}