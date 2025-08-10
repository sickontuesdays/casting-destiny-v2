// pages/_app.js
import { createContext, useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import manifestManager from '../lib/manifest-manager'
import buildScorer from '../lib/build-scorer'
import { BuildIntelligence } from '../lib/destiny-intelligence/build-intelligence'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

export const AppContext = createContext()

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [manifest, setManifest] = useState(null)
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [intelligenceStatus, setIntelligenceStatus] = useState({
    isLoading: true,
    isInitialized: false,
    error: null,
    features: []
  })

  useEffect(() => {
    initializeIntelligenceSystem()
  }, [])

  const initializeIntelligenceSystem = async () => {
    try {
      setIntelligenceStatus(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }))

      console.log('🚀 Initializing Casting Destiny v2 Intelligence System...')

      // Step 1: Load and process manifest
      console.log('📦 Loading Destiny 2 manifest...')
      const processedManifest = await manifestManager.loadManifest()
      setManifest(processedManifest)
      console.log('✅ Manifest loaded and processed')

      // Step 2: Initialize build scorer with intelligence
      console.log('🧠 Initializing build intelligence...')
      await buildScorer.initialize(processedManifest)
      console.log('✅ Build scorer initialized')

      // Step 3: Initialize build intelligence for direct use
      console.log('🎯 Setting up build intelligence context...')
      const intelligence = new BuildIntelligence()
      await intelligence.initialize(processedManifest)
      setBuildIntelligence(intelligence)
      console.log('✅ Build intelligence ready')

      // Step 4: Get capabilities
      const capabilities = buildScorer.getScoringCapabilities()
      
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: true,
        error: null,
        features: capabilities.features || [],
        version: capabilities.version,
        manifestVersion: manifestManager.getManifestStats?.()?.version
      })

      console.log('🎉 Intelligence system fully initialized!')
      console.log(`📊 Features available: ${capabilities.features.join(', ')}`)

    } catch (error) {
      console.error('❌ Failed to initialize intelligence system:', error)
      
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: false,
        error: error.message,
        features: []
      })

      // Don't break the app - let components handle the lack of intelligence gracefully
      console.log('⚠️  App will run with limited functionality')
    }
  }

  const refreshIntelligence = async (forceRefresh = false) => {
    try {
      console.log('🔄 Refreshing intelligence system...')
      
      // Refresh manifest
      const freshManifest = await manifestManager.loadManifest(forceRefresh)
      setManifest(freshManifest)

      // Re-initialize intelligence components
      await buildScorer.initialize(freshManifest)
      
      if (buildIntelligence) {
        await buildIntelligence.initialize(freshManifest)
      }

      setIntelligenceStatus(prev => ({
        ...prev,
        error: null,
        manifestVersion: manifestManager.getManifestStats?.()?.version
      }))

      console.log('✅ Intelligence system refreshed successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to refresh intelligence system:', error)
      setIntelligenceStatus(prev => ({
        ...prev,
        error: error.message
      }))
      return false
    }
  }

  const contextValue = {
    // Core manifest data
    manifest,
    
    // Intelligence components
    buildIntelligence,
    buildScorer,
    manifestManager,
    
    // System status
    intelligenceStatus,
    
    // Utility functions
    refreshIntelligence,
    
    // Quick access methods
    isIntelligenceReady: () => intelligenceStatus.isInitialized && !intelligenceStatus.error,
    getIntelligenceFeatures: () => intelligenceStatus.features,
    getSystemVersion: () => intelligenceStatus.version
  }

  return (
    <SessionProvider session={session}>
      <AppContext.Provider value={contextValue}>
        <div className="app">
          {/* Intelligence Status Indicator */}
          {intelligenceStatus.isLoading && (
            <div className="intelligence-loading-banner">
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <span>🧠 Initializing Intelligence System...</span>
              </div>
            </div>
          )}

          {intelligenceStatus.error && (
            <div className="intelligence-error-banner">
              <div className="error-content">
                <span>⚠️ Intelligence System Error: {intelligenceStatus.error}</span>
                <button 
                  onClick={() => refreshIntelligence(true)}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {intelligenceStatus.isInitialized && !intelligenceStatus.error && (
            <div className="intelligence-ready-indicator">
              <span className="ready-dot"></span>
              <span>AI Enhanced</span>
            </div>
          )}

          <Component {...pageProps} />
        </div>
      </AppContext.Provider>
    </SessionProvider>
  )
}

export default MyApp