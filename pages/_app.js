// pages/_app.js
// Main app with Build Intelligence System integration

import '../styles/globals.css'
import '../styles/destiny-theme.css'
import '../styles/components.css'
import '../styles/build-display.css'
import '../styles/enhanced-creator.css'
import { AuthProvider } from '../lib/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Initialize BIS on app load
    if (typeof window !== 'undefined') {
      initializeBIS()
    }

    // Track page views
    const handleRouteChange = (url) => {
      console.log('App navigated to:', url)
      
      // Track BIS usage
      if (url.includes('build-creator')) {
        trackBISUsage('page_view')
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

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
          window.sessionStorage.setItem('bis_manifest_stats', JSON.stringify(manifestData.stats))
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

  const trackBISUsage = (action) => {
    // Track BIS usage for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'bis_usage', {
        event_category: 'Build Intelligence System',
        event_label: action,
        value: 1
      })
    }
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <Component {...pageProps} />
        
        {/* Global BIS Status Indicator */}
        <BISStatusIndicator />
      </div>
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
    
    window.addEventListener('bis-status', handleBISEvent)
    return () => window.removeEventListener('bis-status', handleBISEvent)
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
    </div>
  )
}

// Add custom error boundary for BIS
export function reportWebVitals(metric) {
  // Report BIS-specific metrics
  if (metric.name.includes('BIS') || metric.label?.includes('build')) {
    console.log('BIS Performance:', metric)
  }
}

export default MyApp

// BIS Status Indicator Styles (add to globals.css or here)
const bisStatusStyles = `
  <style jsx global>{
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
  }</style>
`