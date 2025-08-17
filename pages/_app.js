import React, { useState, useEffect, createContext } from 'react'
import { AuthProvider } from '../lib/useAuth'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

// Create AppContext for global state management
export const AppContext = createContext({
  manifest: null,
  manifestLoading: false,
  manifestError: null,
  setManifest: () => {},
  refreshManifest: () => {}
})

function MyApp({ Component, pageProps }) {
  const [manifest, setManifest] = useState(null)
  const [manifestLoading, setManifestLoading] = useState(false)
  const [manifestError, setManifestError] = useState(null)

  // Refresh manifest from GitHub cache (not Bungie directly)
  const refreshManifest = async () => {
    try {
      setManifestLoading(true)
      setManifestError(null)
      
      // Load from GitHub cache endpoint
      const response = await fetch('/api/github/manifest')
      
      if (response.ok) {
        const data = await response.json()
        setManifest(data)
        console.log('✅ Manifest loaded from GitHub cache')
      } else if (response.status === 404) {
        // Don't retry on 404 - endpoint doesn't exist yet
        console.warn('Manifest endpoint not found - may need to deploy fixes')
        setManifestError('Manifest endpoint not deployed yet')
      } else {
        // Don't block app if manifest isn't available
        console.warn('Manifest not available in GitHub cache')
        setManifestError('Manifest not cached yet')
      }
    } catch (error) {
      console.warn('Failed to load manifest:', error)
      setManifestError(error.message)
    } finally {
      setManifestLoading(false)
    }
  }

  // Only load manifest after user logs in (handled by components)
  useEffect(() => {
    // Check if manifest exists in GitHub on app load but don't block
    const checkManifestAvailability = async () => {
      try {
        const response = await fetch('/api/github/manifest/status')
        if (response.ok) {
          const status = await response.json()
          console.log('Manifest status:', status)
        }
      } catch (error) {
        console.log('Manifest not available yet')
      }
    }
    
    checkManifestAvailability()
  }, [])

  const contextValue = {
    manifest,
    manifestLoading,
    manifestError,
    setManifest,
    refreshManifest
  }

  return (
    <AuthProvider>
      <AppContext.Provider value={contextValue}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppContext.Provider>
    </AuthProvider>
  )
}

export default MyApp