import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from '../pages/_app'

export default function UserInventory() {
  const { session, isLoading } = useAuth()
  const { manifest, isIntelligenceReady } = useContext(AppContext)
  const [inventory, setInventory] = useState(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (session?.user && session.accessToken) {
      loadUserInventory()
    }
  }, [session])

  const loadUserInventory = async () => {
    if (!session?.user?.membershipId || !session.accessToken) {
      setError('Authentication required to load inventory')
      return
    }

    setIsLoadingInventory(true)
    setError(null)

    try {
      console.log('Loading user inventory for:', session.user.displayName)
      
      const response = await fetch('/api/bungie/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          membershipType: session.user.membershipType,
          membershipId: session.user.membershipId,
          accessToken: session.accessToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const inventoryData = await response.json()
      
      if (inventoryData.success) {
        setInventory(inventoryData.inventory)
        setSelectedCharacter(0) // Select first character by default
        setRetryCount(0)
        console.log('Inventory loaded successfully')
      } else {
        throw new Error(inventoryData.error || 'Failed to load inventory')
      }

    } catch (error) {
      console.error('Error loading inventory:', error)
      setError(error.message)
      
      // Auto-retry logic for temporary failures
      if (retryCount < 3 && (
        error.message.includes('503') || 
        error.message.includes('timeout') ||
        error.message.includes('network')
      )) {
        console.log(`Retrying inventory load (attempt ${retryCount + 1})...`)
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadUserInventory()
        }, 2000 * (retryCount + 1))
      }
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const getFilteredItems = () => {
    if (!inventory || !inventory.characters) return []

    const character = inventory.characters[selectedCharacter]
    if (!character) return []

    let items = [
      ...character.equipped,
      ...character.inventory,
      ...(inventory.vault || [])
    ]

    // Filter by category
    if (filterCategory !== 'all') {
      items = items.filter(item => {
        if (filterCategory === 'weapons') return item.itemType === 3
        if (filterCategory === 'armor') return item.itemType === 2
        if (filterCategory === 'exotic') return item.tier === 'Exotic'
        return true
      })
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      )
    }

    return items
  }

  const getItemIcon = (item) => {
    if (item.icon) {
      return `https://www.bungie.net${item.icon}`
    }
    return '/default-item-icon.png'
  }

  const getItemRarityClass = (tier) => {
    switch (tier) {
      case 'Exotic': return 'exotic'
      case 'Legendary': return 'legendary'
      case 'Rare': return 'rare'
      case 'Uncommon': return 'uncommon'
      default: return 'common'
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    loadUserInventory()
  }

  if (isLoading) {
    return (
      <div className="user-inventory loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading user session...</span>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="user-inventory auth-required">
        <div className="auth-prompt">
          <h3>🎒 User Inventory</h3>
          <p>Sign in with Bungie to view your Destiny 2 inventory</p>
          <div className="auth-features">
            <div className="feature">✓ View all characters</div>
            <div className="feature">✓ Access vault items</div>
            <div className="feature">✓ Use only owned items for builds</div>
            <div className="feature">✓ Smart item recommendations</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-inventory">
      <div className="inventory-header">
        <h3>🎒 {session.user.displayName}'s Inventory</h3>
        
        {!isIntelligenceReady() && (
          <div className="intelligence-warning">
            ⚠️ Intelligence system loading... Enhanced features limited
          </div>
        )}
        
        <button 
          onClick={handleRetry}
          disabled={isLoadingInventory}
          className="refresh-btn"
          title="Refresh Inventory"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-section">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <div className="error-title">Failed to load inventory</div>
              <div className="error-details">{error}</div>
              {error.includes('Origin header') && (
                <div className="error-help">
                  This is a configuration issue. The app domain needs to be registered with Bungie.
                </div>
              )}
            </div>
            <button onClick={handleRetry} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}

      {isLoadingInventory && (
        <div className="loading-section">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <span>Loading your Destiny 2 inventory...</span>
            {retryCount > 0 && (
              <div className="retry-info">Retry attempt {retryCount}/3</div>
            )}
          </div>
        </div>
      )}

      {inventory && (
        <>
          {/* Character Selection */}
          {inventory.characters && inventory.characters.length > 1 && (
            <div className="character-selection">
              {inventory.characters.map((character, index) => (
                <button
                  key={character.characterId}
                  className={`character-btn ${selectedCharacter === index ? 'active' : ''}`}
                  onClick={() => setSelectedCharacter(index)}
                >
                  <div className="character-info">
                    <span className="character-class">{character.class}</span>
                    <span className="character-level">Level {character.level}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="inventory-filters">
            <div className="filter-row">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="category-filter"
              >
                <option value="all">All Items</option>
                <option value="weapons">Weapons</option>
                <option value="armor">Armor</option>
                <option value="exotic">Exotic Only</option>
              </select>

              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-filter"
              />
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="inventory-grid">
            {getFilteredItems().map((item, index) => (
              <div 
                key={`${item.instanceId || item.hash}-${index}`}
                className={`inventory-item ${getItemRarityClass(item.tier)}`}
                title={item.description}
              >
                <div className="item-icon">
                  <img 
                    src={getItemIcon(item)} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = '/default-item-icon.png'
                    }}
                  />
                  {item.tier === 'Exotic' && (
                    <div className="exotic-badge">⭐</div>
                  )}
                </div>
                
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-type">{item.typeName}</div>
                  {item.powerLevel && (
                    <div className="item-power">{item.powerLevel}</div>
                  )}
                </div>

                {item.isEquipped && (
                  <div className="equipped-badge">Equipped</div>
                )}

                {item.location === 'vault' && (
                  <div className="vault-badge">Vault</div>
                )}
              </div>
            ))}
          </div>

          {getFilteredItems().length === 0 && !isLoadingInventory && (
            <div className="no-items">
              <p>No items match your current filters</p>
              <button onClick={() => {
                setFilterCategory('all')
                setSearchTerm('')
              }}>
                Clear Filters
              </button>
            </div>
          )}

          {/* Inventory Stats */}
          {inventory.stats && (
            <div className="inventory-stats">
              <div className="stat-item">
                <span className="stat-label">Total Items:</span>
                <span className="stat-value">{inventory.stats.totalItems}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Vault Usage:</span>
                <span className="stat-value">
                  {inventory.stats.vaultUsed}/{inventory.stats.vaultCapacity}
                </span>
              </div>
              {inventory.stats.exoticCount && (
                <div className="stat-item">
                  <span className="stat-label">Exotics:</span>
                  <span className="stat-value">{inventory.stats.exoticCount}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}