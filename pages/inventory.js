import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import InventoryDisplay from '../components/InventoryDisplay'

export default function InventoryPage() {
  const { session, isLoading: authLoading } = useAuth()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (session?.user) {
      loadInventory()
    }
  }, [session])

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading inventory from Bungie API...')
      
      const response = await fetch('/api/bungie/inventory', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 401) {
          throw new Error('Authentication expired. Please sign in again.')
        } else if (response.status === 503) {
          throw new Error('Bungie.net is currently under maintenance.')
        } else if (response.status === 404) {
          throw new Error('No Destiny account found. Make sure you have Destiny 2 characters.')
        } else {
          throw new Error(errorData.error || `Failed to load inventory (${response.status})`)
        }
      }
      
      const data = await response.json()
      
      console.log('Inventory loaded successfully:', {
        characters: data.characters?.length || 0,
        vaultItems: Object.values(data.vault || {}).reduce((sum, items) => sum + (items?.length || 0), 0),
        currencies: data.currencies?.length || 0
      })
      
      setInventory(data)
      setLastUpdated(new Date().toLocaleString())
      
    } catch (error) {
      console.error('Error loading inventory:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="inventory-page">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="inventory-page">
        <div className="auth-required">
          <div className="auth-container">
            <h1>Authentication Required</h1>
            <p>Sign in with your Bungie.net account to view your Destiny 2 inventory.</p>
            <button 
              className="login-btn primary"
              onClick={() => window.location.href = '/api/auth/bungie-login'}
            >
              Sign in with Bungie.net
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Destiny 2 Inventory</h1>
            <p>Your complete Destiny 2 inventory across all characters and vault</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={loadInventory}
              className="refresh-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {lastUpdated && !loading && (
          <div className="last-updated">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-details">
              <strong>Failed to load inventory</strong>
              <p>{error}</p>
            </div>
            <button 
              onClick={loadInventory}
              className="retry-btn"
              disabled={loading}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading && !inventory && (
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h3>Loading your Destiny 2 inventory...</h3>
            <p>Fetching data from Bungie.net servers</p>
          </div>
        </div>
      )}

      {inventory && (
        <InventoryDisplay 
          inventory={inventory}
          loading={loading}
          onRefresh={loadInventory}
        />
      )}

      {!loading && !inventory && !error && (
        <div className="empty-state">
          <div className="empty-content">
            <h3>No inventory data loaded</h3>
            <p>Click refresh to load your Destiny 2 inventory</p>
            <button 
              onClick={loadInventory}
              className="load-btn primary"
            >
              Load Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  )
}