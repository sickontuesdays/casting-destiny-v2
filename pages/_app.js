import '../styles/globals.css'
import { useState, useEffect, createContext } from 'react'
import Layout from '../components/Layout'
import { AuthProvider } from '../lib/useAuth'
import { BuildIntelligence } from '../lib/destiny-intelligence/build-intelligence'
import { getClientManifestLoader } from '../lib/client-manifest-loader'

// Create context for sharing data between components
export const AppContext = createContext({})

function MyApp({ Component, pageProps }) {
  const [manifest, setManifest] = useState(null)
  const [manifestLoading, setManifestLoading] = useState(true)
  const [manifestError, setManifestError] = useState(null)
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)

  // Load manifest on app startup
  useEffect(() => {
    loadManifest()
  }, [])

  // Initialize build intelligence when manifest is loaded
  useEffect(() => {
    if (manifest && !buildIntelligence) {
      initializeBuildIntelligence()
    }
  }, [manifest, buildIntelligence])

  const loadManifest = async () => {
    try {
      setManifestLoading(true)
      setManifestError(null)
      
      console.log('Loading manifest from GitHub cache...')
      
      // Try GitHub cache first
      let manifestData = null
      try {
        const response = await fetch('/api/github/get-manifest')
        if (response.ok) {
          manifestData = await response.json()
          console.log('✅ Manifest loaded successfully from GitHub cache')
        } else {
          console.log('GitHub cache not available, loading directly from Bungie...')
        }
      } catch (githubError) {
        console.log('GitHub cache failed, loading directly from Bungie...')
      }
      
      // If GitHub cache failed, load directly from Bungie in browser (bypassing Vercel)
      if (!manifestData) {
        console.log('🌐 Loading manifest directly from Bungie in browser...')
        
        const clientLoader = getClientManifestLoader()
        await clientLoader.initialize()
        manifestData = await clientLoader.loadManifest()
        
        console.log('✅ Manifest loaded directly from Bungie, bypassing Vercel entirely')
      }
      
      setManifest(manifestData)
      console.log(`Version: ${manifestData.version}, Items: ${manifestData.metadata?.itemCount || 'unknown'}`)
      
    } catch (error) {
      console.error('Failed to load manifest:', error)
      setManifestError(error.message)
    } finally {
      setManifestLoading(false)
    }
  }

  const initializeBuildIntelligence = async () => {
    try {
      setIntelligenceLoading(true)
      
      console.log('🧠 Initializing Build Intelligence with manifest...')
      
      // Create new BuildIntelligence instance
      const intelligence = new BuildIntelligence()
      
      // Initialize it with the loaded manifest
      await intelligence.initialize(manifest)
      
      setBuildIntelligence(intelligence)
      
      console.log('✅ Build Intelligence initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Build Intelligence:', error)
      setManifestError('Failed to initialize AI system: ' + error.message)
    } finally {
      setIntelligenceLoading(false)
    }
  }

  const refreshManifest = async () => {
    console.log('🔄 Refreshing manifest...')
    setBuildIntelligence(null) // Reset intelligence when refreshing manifest
    await loadManifest()
  }

  const isIntelligenceReady = () => {
    return buildIntelligence && buildIntelligence.isInitialized() && !intelligenceLoading
  }

  const contextValue = {
    manifest,
    manifestLoading,
    manifestError,
    buildIntelligence,
    intelligenceLoading,
    isIntelligenceReady,
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