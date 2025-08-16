import React, { useState, useEffect, createContext } from 'react'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

// Create AppContext for global state management
export const AppContext = createContext({
  manifest: null,
  intelligenceStatus: {
    isLoading: false,
    isInitialized: false,
    error: null,
    features: [],
    version: null
  }
})

function MyApp({ Component, pageProps }) {
  const [manifest, setManifest] = useState(null)
  const [intelligenceStatus, setIntelligenceStatus] = useState({
    isLoading: true,
    isInitialized: false,
    error: null,
    features: [],
    version: null
  })

  useEffect(() => {
    loadBasicSystem()
  }, [])

  const loadBasicSystem = async () => {
    console.log('🚀 Loading basic system...')
    
    try {
      // Just load the manifest manager
      const ManifestManager = (await import('../lib/manifest-manager')).default
      const manifestMgr = new ManifestManager()
      
      // Load manifest with fallback
      let manifestData
      try {
        manifestData = await manifestMgr.loadManifest()
      } catch (error) {
        console.warn('Using fallback manifest:', error.message)
        manifestData = manifestMgr.createFallbackManifest()
      }
      
      setManifest(manifestData)
      
      // Set as initialized with basic features
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: true,
        error: null,
        features: [
          'Inventory Management',
          'Build Storage',
          'Friend System'
        ],
        version: manifestData?.version || '2.0.0'
      })
      
      console.log('✅ Basic system loaded!')
      
    } catch (error) {
      console.error('❌ System load failed:', error)
      
      // Allow app to continue without manifest
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: true,
        error: 'Running without manifest',
        features: ['Basic Features'],
        version: 'fallback'
      })
    }
  }

  // Don't show loading screen for too long
  if (intelligenceStatus.isLoading) {
    // Use a simple timeout to prevent infinite loading
    setTimeout(() => {
      if (intelligenceStatus.isLoading) {
        setIntelligenceStatus(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: 'Load timeout'
        }))
      }
    }, 5000)
    
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <h1>Casting Destiny v2</h1>
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const contextValue = {
    manifest,
    intelligenceStatus
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppContext.Provider>
  )
}

export default MyApp