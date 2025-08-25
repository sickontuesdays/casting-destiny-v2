// pages/index.js
// Fixed homepage with proper imports and BIS integration

import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from './_app'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'
import Link from 'next/link'

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
      console.log('User logged in, loading manifest...')
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
            <span>Loading game data...</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome back, {session?.user?.displayName || 'Guardian'}</h1>
        <p>Choose how you want to create your build:</p>
      </div>

      {/* Main Action Cards */}
      <div className="home-container">
        <div className="action-cards">
          {/* Build Creator Card */}
          <div className="action-card">
            <div className="card-icon">🎯</div>
            <h2>Build Intelligence System</h2>
            <p>Use AI to generate optimized builds based on your requirements</p>
            <Link href="/build-creator">
              <a className="card-btn primary">
                Create Build with AI
              </a>
            </Link>
          </div>

          {/* Natural Language Card */}
          <div className="action-card">
            <div className="card-icon">💬</div>
            <h2>Natural Language</h2>
            <p>Describe your ideal build in plain English</p>
            <div className="quick-input">
              <NaturalLanguageInput 
                onBuildGenerated={setCurrentBuild}
                disabled={!manifest}
                lockedExotic={lockedExotic}
                placeholder={!manifest ? 
                  "Waiting for game data..." : "Describe your ideal build..."}
              />
            </div>
          </div>

          {/* Inventory Card */}
          <div className="action-card">
            <div className="card-icon">📦</div>
            <h2>Your Inventory</h2>
            <p>View and manage your Destiny 2 items</p>
            <Link href="/inventory">
              <a className="card-btn secondary">
                View Inventory
              </a>
            </Link>
          </div>

          {/* Saved Builds Card */}
          <div className="action-card">
            <div className="card-icon">💾</div>
            <h2>Saved Builds</h2>
            <p>Access your saved and shared builds</p>
            <Link href="/builds">
              <a className="card-btn secondary">
                View Builds
              </a>
            </Link>
          </div>
        </div>

        {/* Quick Build Display */}
        {currentBuild && (
          <div className="quick-build-section">
            <h3>Generated Build</h3>
            <BuildDisplay 
              build={currentBuild}
              onExoticLock={setLockedExotic}
              lockedExotic={lockedExotic}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .home-page {
          min-height: calc(100vh - 120px);
          padding: 2rem 0;
        }

        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 1rem;
        }

        .login-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }

        .login-container {
          background: rgba(20, 20, 20, 0.8);
          border: 1px solid #333;
          border-radius: 1rem;
          padding: 3rem 2rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        .login-container h1 {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #ff6b35, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .tagline {
          color: #888;
          margin-bottom: 2rem;
        }

        .error-banner {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid #ff4444;
          border-radius: 0.5rem;
          padding: 0.75rem;
          margin-bottom: 1.5rem;
          color: #ff6666;
        }

        .login-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        .login-info {
          margin-top: 2rem;
          text-align: left;
        }

        .login-info p {
          color: #aaa;
          margin-bottom: 1rem;
        }

        .login-info ul {
          list-style: none;
          padding: 0;
        }

        .login-info li {
          color: #888;
          margin-bottom: 0.5rem;
        }

        .intelligence-loading-banner {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1));
          border-bottom: 1px solid #ff6b35;
          padding: 1rem;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .loading-spinner.small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 107, 53, 0.3);
          border-top-color: #ff6b35;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .hero-section {
          text-align: center;
          padding: 2rem 0;
          margin-bottom: 2rem;
        }

        .hero-section h1 {
          font-size: 2rem;
          color: #ff6b35;
          margin-bottom: 0.5rem;
        }

        .hero-section p {
          color: #888;
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .action-card {
          background: rgba(20, 20, 20, 0.7);
          border: 1px solid #333;
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .action-card:hover {
          border-color: #ff6b35;
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(255, 107, 53, 0.2);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .action-card h2 {
          color: #e0e0e0;
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .action-card p {
          color: #888;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .card-btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .card-btn.primary {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: #fff;
        }

        .card-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border: 1px solid #666;
        }

        .card-btn:hover {
          transform: translateY(-2px);
        }

        .quick-input {
          margin-top: 1rem;
        }

        .quick-build-section {
          margin-top: 3rem;
          padding: 2rem;
          background: rgba(20, 20, 20, 0.5);
          border-radius: 1rem;
          border: 1px solid #333;
        }

        .quick-build-section h3 {
          color: #ff6b35;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .action-cards {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .hero-section h1 {
            font-size: 1.5rem;
          }

          .login-container {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}