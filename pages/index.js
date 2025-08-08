import { useSession, signIn } from 'next-auth/react'
import { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppContext } from './_app'
import BuildCreator from '../components/BuildCreator'
import NaturalLanguageInput from '../components/NaturalLanguageInput'
import BuildDisplay from '../components/BuildDisplay'
import UserInventory from '../components/UserInventory'

export default function Home() {
  const { data: session, status } = useSession()
  const { manifest, loading } = useContext(AppContext)
  const [currentBuild, setCurrentBuild] = useState(null)
  const [buildRequest, setBuildRequest] = useState('')
  const [useInventoryOnly, setUseInventoryOnly] = useState(false)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [customSession, setCustomSession] = useState(null)
  const [authError, setAuthError] = useState('')
  const router = useRouter()

  // Check for authentication errors in URL
  useEffect(() => {
    if (router.query.error) {
      setAuthError(router.query.error)
    }
  }, [router.query.error])

  // Check for custom session cookie
  useEffect(() => {
    const checkCustomSession = async () => {
      try {
        const response = await fetch('/api/auth/session-check')
        if (response.ok) {
          const sessionData = await response.json()
          if (sessionData.user) {
            setCustomSession(sessionData)
          }
        }
      } catch (error) {
        console.error('Error checking custom session:', error)
      }
    }
    
    if (!session) {
      checkCustomSession()
    }
  }, [session])

  const handleCustomLogin = () => {
    window.location.href = '/api/auth/bungie-login'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="loading-screen">
        <div className="destiny-loader"></div>
        <p>Loading Destiny 2 data...</p>
      </div>
    )
  }

  if (!session && !customSession) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <h1>Casting Destiny v2</h1>
          <p>Create the perfect Destiny 2 build for any situation</p>
          
          {authError && (
            <div className="error-message" style={{
              background: 'rgba(231, 111, 81, 0.2)',
              border: '1px solid #e76f51',
              borderRadius: '0.5rem',
              padding: '1rem',
              margin: '1rem 0',
              color: '#e76f51'
            }}>
              <strong>Login Error:</strong> {authError}
              <br />
              <small>Check Vercel logs for more details</small>
            </div>
          )}
          
          <button 
            className="bungie-login-btn"
            onClick={() => signIn('bungie')}
          >
            Sign in with Bungie.net (NextAuth)
          </button>
          
          <button 
            className="bungie-login-btn"
            onClick={handleCustomLogin}
            style={{ marginTop: '1rem', background: 'linear-gradient(45deg, #2a9d8f, #264653)' }}
          >
            Sign in with Bungie.net (Custom)
          </button>
        </div>
      </div>
    )
  }

  const currentSession = session || customSession

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
                session={currentSession}
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
              session={currentSession}
            />
          </div>
        )}
      </div>

      <div className="sidebar">
        <UserInventory session={currentSession} />
      </div>
    </div>
  )
}