// pages/_app.js
// Fixed version with AppContext export and BIS integration

import React, { useState, useEffect, createContext } from 'react'
import { AuthProvider } from '../lib/useAuth'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'
import '../styles/components.css'
// Only import these if the files exist
// import '../styles/build-display.css'
// import '../styles/enhanced-creator.css'

// Create AppContext for global state management - THIS IS WHAT index.js needs
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

  // Refresh manifest from the NEW endpoint
  const refreshManifest = async () => {
    try {
      setManifestLoading(true)
      setManifestError(null)
      
      // Use the NEW manifest endpoint, not the old GitHub one
      const response = await fetch('/api/manifest')
      
      if (response.ok) {
        const data = await response.json()
        setManifest(data)
        console.log('✅ Manifest loaded successfully')
      } else if (response.status === 404) {
        console.warn('Manifest endpoint not found')
        setManifestError('Manifest endpoint not available')
      } else {
        console.warn('Manifest not available')
        setManifestError('Manifest not available')
      }
    } catch (error) {
      console.warn('Failed to load manifest:', error)
      setManifestError(error.message)
    } finally {
      setManifestLoading(false)
    }
  }

  // Initialize BIS on app load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeBIS()
    }
  }, [])

  const initializeBIS = async () => {
    try {
      // Preload manifest data if available
      const manifestResponse = await fetch('/api/manifest')
      if (manifestResponse.ok) {
        const manifestData = await manifestResponse.json()
        console.log('BIS: Manifest preloaded', manifestData.stats)
        
        // Store in session storage for quick access
        if (window.sessionStorage) {
          window.sessionStorage.setItem('bis_manifest_loaded', 'true')
          window.sessionStorage.setItem('bis_manifest_stats', JSON.stringify(manifestData.stats || {}))
        }
      }
    } catch (error) {
      console.warn('BIS: Could not preload manifest', error)
    }

    // Initialize BIS performance monitoring
    if (window.performance && window.performance.mark) {
      window.performance.mark('bis_initialized')
    }
  }

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
        
        {/* Global BIS Status Indicator */}
        <BISStatusIndicator />
      </AppContext.Provider>
    </AuthProvider>
  )
}

// Global BIS Status Indicator Component
function BISStatusIndicator() {
  const [bisStatus, setBisStatus] = useState('idle')
  
  useEffect(() => {
    // Listen for BIS events
    const handleBISEvent = (event) => {
      if (event.detail) {
        setBisStatus(event.detail.status)
        
        // Auto-hide success messages
        if (event.detail.status === 'success') {
          setTimeout(() => setBisStatus('idle'), 3000)
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('bis-status', handleBISEvent)
      return () => window.removeEventListener('bis-status', handleBISEvent)
    }
  }, [])
  
  if (bisStatus === 'idle') return null
  
  return (
    <div className={`bis-status-indicator ${bisStatus}`}>
      {bisStatus === 'loading' && (
        <>
          <div className="bis-status-spinner"></div>
          <span>Build Intelligence System Processing...</span>
        </>
      )}
      {bisStatus === 'success' && (
        <>
          <span className="bis-status-icon">✓</span>
          <span>Build Generated Successfully</span>
        </>
      )}
      {bisStatus === 'error' && (
        <>
          <span className="bis-status-icon">✗</span>
          <span>Build Generation Failed</span>
        </>
      )}
      
      <style jsx>{`
        .bis-status-indicator {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid #444;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 9999;
          animation: slideInRight 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .bis-status-indicator.loading {
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.1);
        }
        
        .bis-status-indicator.success {
          border-color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
        }
        
        .bis-status-indicator.error {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.1);
        }
        
        .bis-status-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 107, 53, 0.3);
          border-top-color: #ff6b35;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .bis-status-icon {
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .bis-status-indicator.success .bis-status-icon {
          color: #4caf50;
        }
        
        .bis-status-indicator.error .bis-status-icon {
          color: #f44336;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .bis-status-indicator {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default MyApp