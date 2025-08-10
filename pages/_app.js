import React, { useState, useEffect, createContext, useContext } from 'react'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

// Create AppContext
const AppContext = createContext({
  manifest: null,
  buildIntelligence: null,
  buildScorer: null,
  manifestManager: null,
  intelligenceStatus: {
    isLoading: false,
    isInitialized: false,
    error: null,
    features: [],
    version: null
  },
  refreshIntelligence: async () => false,
  isIntelligenceReady: () => false,
  getIntelligenceFeatures: () => [],
  getSystemVersion: () => null
})

export { AppContext }

export const useAppContext = () => useContext(AppContext)

function MyApp({ Component, pageProps }) {
  const [manifest, setManifest] = useState(null)
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [buildScorer, setBuildScorer] = useState(null)
  const [manifestManager, setManifestManager] = useState(null)
  const [intelligenceStatus, setIntelligenceStatus] = useState({
    isLoading: false,
    isInitialized: false,
    error: null,
    features: [],
    version: null
  })

  // Initialize intelligence system on app start
  useEffect(() => {
    initializeIntelligenceSystem()
  }, [])

  const initializeIntelligenceSystem = async () => {
    setIntelligenceStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      console.log('🧠 Initializing Intelligence System...')

      // Import intelligence system components
      const { default: ManifestManager } = await import('../lib/manifest-manager')
      const { EnhancedBuildScorer } = await import('../lib/enhanced-build-scorer')
      const { BuildIntelligence } = await import('../lib/destiny-intelligence/build-intelligence')

      // Initialize manifest manager
      const manifestMgr = new ManifestManager()
      const manifestData = await manifestMgr.loadManifest()
      
      console.log('📄 Manifest loaded successfully')
      setManifest(manifestData)
      setManifestManager(manifestMgr)

      // Initialize build intelligence
      const intelligence = new BuildIntelligence()
      await intelligence.initialize(manifestData)
      setBuildIntelligence(intelligence)

      // Initialize enhanced build scorer
      const scorer = new EnhancedBuildScorer()
      await scorer.initialize(manifestData)
      setBuildScorer(scorer)

      // Update status
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: true,
        error: null,
        features: [
          'Natural Language Processing',
          'Synergy Analysis',
          'Build Optimization',
          'Exotic Recommendations',
          'Stat Calculations'
        ],
        version: manifestData?.version || '1.0.0'
      })

      console.log('✅ Intelligence System initialized successfully!')

    } catch (error) {
      console.error('❌ Failed to initialize intelligence system:', error)
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: false,
        error: error.message,
        features: [],
        version: null
      })
    }
  }

  const refreshIntelligence = async (forceRefresh = false) => {
    console.log('🔄 Refreshing intelligence system...')
    
    try {
      setIntelligenceStatus(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }))

      // Refresh manifest
      if (manifestManager) {
        const refreshedManifest = await manifestManager.loadManifest(forceRefresh)
        setManifest(refreshedManifest)

        // Re-initialize intelligence components with refreshed data
        if (buildIntelligence) {
          await buildIntelligence.initialize(refreshedManifest)
        }
        if (buildScorer) {
          await buildScorer.initialize(refreshedManifest)
        }
      }

      setIntelligenceStatus(prev => ({
        ...prev,
        isLoading: false,
        version: manifest?.version
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
  )
}

export default MyApp