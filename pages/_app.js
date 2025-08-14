import React, { useState, useEffect, createContext, useContext } from 'react'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

// Create AppContext for global state management
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

      // Import intelligence components dynamically
      const [
        { default: ManifestManager },
        { EnhancedBuildScorer },
        { BuildIntelligence }
      ] = await Promise.all([
        import('../lib/manifest-manager'),
        import('../lib/enhanced-build-scorer'),
        import('../lib/destiny-intelligence/build-intelligence')
      ])

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

      setIntelligenceStatus({
        isLoading: false,
        isInitialized: true,
        error: null,
        features: [
          'Natural Language Processing',
          'Synergy Analysis',
          'Build Optimization',
          'Exotic Recommendations',
          'Stat Calculations',
          'Activity-Specific Builds'
        ],
        version: manifestData?.version || '2.0.0'
      })

      console.log('✅ Intelligence System initialized successfully!')

    } catch (error) {
      console.error('❌ Intelligence System initialization failed:', error)
      setIntelligenceStatus({
        isLoading: false,
        isInitialized: false,
        error: error.message,
        features: [],
        version: null
      })
    }
  }

  const refreshIntelligence = async (force = false) => {
    if (intelligenceStatus.isLoading) return false
    
    if (force || !intelligenceStatus.isInitialized) {
      await initializeIntelligenceSystem()
      return true
    }
    return false
  }

  const isIntelligenceReady = () => {
    return intelligenceStatus.isInitialized && !intelligenceStatus.error
  }

  const getIntelligenceFeatures = () => {
    return intelligenceStatus.features
  }

  const getSystemVersion = () => {
    return intelligenceStatus.version
  }

  const contextValue = {
    manifest,
    buildIntelligence,
    buildScorer,
    manifestManager,
    intelligenceStatus,
    refreshIntelligence,
    isIntelligenceReady,
    getIntelligenceFeatures,
    getSystemVersion
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Layout>
        {/* Intelligence Status Indicators */}
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
      </Layout>
    </AppContext.Provider>
  )
}

export default MyApp