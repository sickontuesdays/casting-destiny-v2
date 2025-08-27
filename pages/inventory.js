// pages/inventory.js
// Fixed to use direct Bungie API calls instead of Vercel API routes

import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import InventoryDisplay from '../components/InventoryDisplay'
import { BungieApiService } from '../lib/bungie-api-service'

export default function InventoryPage() {
  const { session, isLoading: authLoading } = useAuth()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [bungieApi, setBungieApi] = useState(null)

  // Initialize Bungie API service when session is available
  useEffect(() => {
    if (session?.accessToken) {
      console.log('🔧 Initializing BungieApiService for direct calls...')
      const api = new BungieApiService(session.accessToken)
      setBungieApi(api)
    }
  }, [session])

  // Load inventory when API service is ready
  useEffect(() => {
    if (bungieApi && session?.user) {
      loadInventoryDirectly()
    }
  }, [bungieApi, session])

  // FIXED: Use direct browser-to-Bungie calls instead of /api/bungie/inventory
  const loadInventoryDirectly = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📦 Loading inventory directly from Bungie (Browser → Bungie)...')
      
      if (!bungieApi) {
        throw new Error('Bungie API service not initialized')
      }

      // Get user's destiny memberships directly
      const { destinyMemberships, primaryMembership } = await bungieApi.getDestinyMemberships()
      
      if (!primaryMembership) {
        throw new Error('No Destiny account found. Make sure you have Destiny 2 characters.')
      }

      console.log(`📋 Loading complete inventory for ${primaryMembership.displayName}...`)

      // Get complete inventory directly from Bungie (bypasses Vercel entirely)
      const inventoryData = await bungieApi.getCompleteInventory(
        primaryMembership.membershipType,
        primaryMembership.membershipId
      )

      console.log('✅ Inventory loaded successfully via direct API calls')
      console.log(`Characters: ${inventoryData.characters?.length || 0}`)
      console.log(`Vault items: ${inventoryData.vault?.items?.length || 0}`)

      setInventory({
        ...inventoryData,
        membership: primaryMembership
      })
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Direct inventory loading failed:', error)
      setError(error.message)
      
      // Don't fallback to API route - that causes 4MB errors
      console.log('ℹ️ No fallback to API routes to avoid 4MB Vercel limits')
      
    } finally {
      setLoading(false)
    }
  }

  const refreshInventory = async () => {
    if (bungieApi) {
      await loadInventoryDirectly()
    }
  }

  // Show loading state during auth
  if (authLoading) {
    return (
      <div className="inventory-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <div className="inventory-page">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in with your Bungie account to view your inventory.</p>
          <a href="/api/auth/signin" className="signin-btn">
            Sign In with Bungie
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Guardian Inventory</h1>
        <div className="inventory-controls">
          <button 
            onClick={refreshInventory} 
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-message">
            <strong>Inventory Error:</strong> {error}
          </div>
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
          
          {error.includes('Authentication') && (
            <div className="error-actions">
              <a href="/api/auth/signin" className="signin-btn small">
                Re-authenticate
              </a>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Loading inventory from Bungie...</p>
          <small>Using direct API calls (no Vercel limits)</small>
        </div>
      )}

      {inventory && !loading && (
        <div className="inventory-content">
          <div className="inventory-summary">
            <h3>Guardian: {inventory.membership?.displayName}</h3>
            <div className="summary-stats">
              <span>Characters: {inventory.characters?.length || 0}</span>
              <span>Vault Items: {inventory.vault?.items?.length || 0}</span>
            </div>
          </div>
          
          <InventoryDisplay 
            inventory={inventory}
            onRefresh={refreshInventory}
          />
        </div>
      )}

      {!inventory && !loading && !error && (
        <div className="empty-state">
          <h3>Ready to Load Inventory</h3>
          <p>Click refresh to load your Destiny 2 inventory directly from Bungie.</p>
          <button onClick={refreshInventory} className="load-btn">
            Load Inventory
          </button>
        </div>
      )}
    </div>
  )
}