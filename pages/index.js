import { useState, useContext, useEffect } from 'react'
import { AppContext } from './_app'
import BuildCreator from '../components/BuildCreator'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'

export default function Home() {
  const { manifest, loading } = useContext(AppContext)
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [currentBuild, setCurrentBuild] = useState(null)
  const [buildRequest, setBuildRequest] = useState('')
  const [useInventoryOnly, setUseInventoryOnly] = useState(false)
  const [lockedExotic, setLockedExotic] = useState(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      // Check for custom session cookie
      const cookies = document.cookie.split(';')
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('bungie_session='))
      
      if (sessionCookie) {
        const sessionData = sessionCookie.split('=')[1]
        const decodedSession = JSON.parse(Buffer.from(sessionData, 'base64').toString())
        
        // Check if session is still valid
        if (decodedSession.expiresAt > Date.now()) {
          setSession(decodedSession)
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/bungie-login'
  }

  const handleLogout = () => {
    // Clear session cookie
    document.cookie = 'bungie_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setSession(null)
    setCurrentBuild(null)
  }

  if (sessionLoading || loading) {
    return (
      <div className="loading-screen">
        <div className="destiny-loader"></div>
        <p>Loading Destiny 2 data...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <h1>Casting Destiny v2</h1>
          <p>Create the perfect Destiny 2 build for any situation</p>
          <button 
            className="bungie-login-btn"
            onClick={handleLogin}
          >
            Sign in with Bungie.net
          </button>
        </div>
      </div>
    )
  }

  const handleBuildGenerated = (build) => {
    setCurrentBuild(build)
  }

  const handleNewSearch = () => {
    setCurrentBuild(null)
    setBuildRequest('')
  }

  return (
    <div className="home-container">
      <div className="main-content">
        <div className="user-header">
          <div className="user-info">
            <span>Welcome, {session.user.name}!</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        {!currentBuild ? (
          <div className="build-creator-section">
            <div className="header-section">
              <h1>Build Creator</h1>
              <p>Describe what you want your build to do, or specify an exotic to build around</p>
            </div>

            <div className="input-section">
              <NaturalLanguageInput
                value={buildRequest}
                onChange={setBuildRequest}
                onSubmit={handleBuildGenerated}
                lockedExotic={lockedExotic}
                useInventoryOnly={useInventoryOnly}
                userSession={session}
              />
              
              <div className="build-options">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={useInventoryOnly}
                    onChange={(e) => setUseInventoryOnly(e.target.checked)}
                  />
                  Use only items from my inventory
                </label>
              </div>
            </div>

            <BuildCreator
              onExoticSelected={setLockedExotic}
              selectedExotic={lockedExotic}
            />
          </div>
        ) : (
          <div className="build-display-section">
            <BuildDisplay
              build={currentBuild}
              onNewSearch={handleNewSearch}
              useInventoryOnly={useInventoryOnly}
            />
          </div>
        )}
      </div>

      <div className="sidebar">
        <UserInventory session={session} />
      </div>
    </div>
  )
}