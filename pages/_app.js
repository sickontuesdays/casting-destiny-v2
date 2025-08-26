import React, { useState, useEffect, createContext } from 'react'
import { AuthProvider } from '../lib/useAuth'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'
import '../styles/components.css'

// Create AppContext for global state management
export const AppContext = createContext({
  manifest: null,
  manifestLoading: false,
  manifestError: null,
  buildIntelligence: null,
  intelligenceLoading: false,
  isIntelligenceReady: () => false,
  setManifest: () => {},
  refreshManifest: () => {}
})

function MyApp({ Component, pageProps }) {
  const [manifest, setManifest] = useState(null)
  const [manifestLoading, setManifestLoading] = useState(false)
  const [manifestError, setManifestError] = useState(null)
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)

  // Load manifest directly from Bungie (bypass GitHub storage)
  const refreshManifest = async () => {
    try {
      setManifestLoading(true)
      setManifestError(null)
      
      console.log('📡 Loading manifest directly from Bungie...')
      
      // Load directly from our filtered Bungie API (smaller response)
      const response = await fetch('/api/bungie/manifest')
      
      if (response.ok) {
        const data = await response.json()
        setManifest(data)
        console.log(`✅ Manifest loaded successfully: ${data.metadata.itemCount} items`)
      } else {
        throw new Error(`Failed to load manifest: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to load manifest:', error)
      setManifestError(error.message)
    } finally {
      setManifestLoading(false)
    }
  }

  // Initialize BuildIntelligence when manifest is loaded
  useEffect(() => {
    const initializeBuildIntelligence = async () => {
      if (manifest && manifest.data && !buildIntelligence && !intelligenceLoading) {
        try {
          setIntelligenceLoading(true)
          console.log('🧠 Initializing Build Intelligence with loaded manifest...')
          
          // Dynamically import BuildIntelligence
          const { BuildIntelligence } = await import('../lib/destiny-intelligence/build-intelligence')
          
          // Create new instance
          const intelligence = new BuildIntelligence()
          
          // Initialize with manifest data
          await intelligence.initialize(manifest.data)
          
          setBuildIntelligence(intelligence)
          console.log('✅ Build Intelligence initialized successfully')
          
        } catch (error) {
          console.error('❌ Failed to initialize Build Intelligence:', error)
          setManifestError(`Build Intelligence initialization failed: ${error.message}`)
        } finally {
          setIntelligenceLoading(false)
        }
      }
    }

    initializeBuildIntelligence()
  }, [manifest, buildIntelligence, intelligenceLoading])

  // Helper function to check if intelligence is ready
  const isIntelligenceReady = () => {
    return !!(buildIntelligence && buildIntelligence.isInitialized && buildIntelligence.isInitialized())
  }

  // Auto-load manifest on app start
  useEffect(() => {
    if (!manifest && !manifestLoading) {
      console.log('🚀 Auto-loading manifest on app start...')
      refreshManifest()
    }
  }, [])

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