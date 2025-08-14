import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function UserInventory({ onExoticLocked }) {
  const { session, isLoading } = useAuth()
  const [inventory, setInventory] = useState(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({
    exotics: true,
    legendaries: false,
    weapons: false
  })

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
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      console.log('Inventory loaded successfully:', data)
      setInventory(data)
      
      // Select first character by default
      if (data.characters && data.characters.length > 0) {
        setSelectedCharacter(0)
      }

    } catch (error) {
      console.error('Failed to load inventory:', error)
      setError(error.message || 'Failed to load inventory')
      
      // Create fallback inventory for demo purposes
      setInventory(createFallbackInventory())
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const createFallbackInventory = () => {
    return {
      characters: [
        {
          characterId: 'demo-hunter',
          className: 'Hunter',
          level: 100,
          powerLevel: 1500,
          lastPlayed: new Date().toISOString()
        },
        {
          characterId: 'demo-titan',
          className: 'Titan', 
          level: 100,
          powerLevel: 1498,
          lastPlayed: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      vault: {
        armor: generateFallbackArmor(),
        weapons: generateFallbackWeapons()
      }
    }
  }

  const generateFallbackArmor = () => {
    return [
      {
        hash: 1001,
        name: 'Ophidian Aspect',
        tier: 'Exotic',
        slot: 'arms',
        classType: 'Warlock',
        description: 'Improved weapon handling and reload speed.',
        stats: { weapons: 25, health: 10 },
        powerLevel: 1520
      },
      {
        hash: 1002,
        name: 'Celestial Nighthawk',
        tier: 'Exotic',
        slot: 'helmet',
        classType: 'Hunter',
        description: 'Golden Gun fires a single devastating shot.',
        stats: { super: 30, weapons: 5 },
        powerLevel: 1518
      },
      {
        hash: 1003,
        name: 'Doom Fang Pauldron',
        tier: 'Exotic',
        slot: 'arms',
        classType: 'Titan',
        description: 'Void melee kills grant Super energy.',
        stats: { melee: 25, super: 15 },
        powerLevel: 1515
      },
      {
        hash: 1004,
        name: 'High-Stat Legendary Helmet',
        tier: 'Legendary',
        slot: 'helmet',
        classType: 'Any',
        description: 'A well-rolled legendary helmet.',
        stats: { health: 20, super: 15, weapons: 10 },
        powerLevel: 1510
      }
    ]
  }

  const generateFallbackWeapons = () => {
    return [
      {
        hash: 2001,
        name: 'Whisper of the Worm',
        tier: 'Exotic',
        type: 'Sniper Rifle',
        slot: 'power',
        description: 'Precision shots refill the magazine.',
        powerLevel: 1525
      },
      {
        hash: 2002,
        name: 'Gjallarhorn',
        tier: 'Exotic',
        type: 'Rocket Launcher',
        slot: 'power',
        description: 'Wolfpack Rounds track targets.',
        powerLevel: 1520
      },
      {
        hash: 2003,
        name: 'Fatebringer (Adept)',
        tier: 'Legendary',
        type: 'Hand Cannon',
        slot: 'kinetic',
        description: 'Classic raid hand cannon.',
        powerLevel: 1515
      }
    ]
  }

  const getFilteredItems = () => {
    if (!inventory) return []

    let items = []
    
    // Combine vault items
    if (inventory.vault) {
      items = [...(inventory.vault.armor || []), ...(inventory.vault.weapons || [])]
    }

    // Add character-specific items if needed
    if (inventory.characters && inventory.characters[selectedCharacter]) {
      const character = inventory.characters[selectedCharacter]
      if (character.equipment) {
        items = [...items, ...character.equipment]
      }
    }

    // Apply filters
    if (filterCategory !== 'all') {
      items = items.filter(item => {
        switch (filterCategory) {
          case 'exotic':
            return item.tier === 'Exotic'
          case 'legendary':
            return item.tier === 'Legendary'
          case 'armor':
            return item.slot && ['helmet', 'arms', 'chest', 'legs', 'class'].includes(item.slot)
          case 'weapons':
            return item.slot && ['kinetic', 'energy', 'power'].includes(item.slot)
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return items
  }

  const handleItemClick = (item) => {
    if (item.tier === 'Exotic' && onExoticLocked) {
      onExoticLocked(item)
    }
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getItemsByCategory = (items) => {
    const categories = {
      exotics: items.filter(item => item.tier === 'Exotic'),
      legendaries: items.filter(item => item.tier === 'Legendary'),
      armor: items.filter(item => item.slot && ['helmet', 'arms', 'chest', 'legs', 'class'].includes(item.slot)),
      weapons: items.filter(item => item.slot && ['kinetic', 'energy', 'power'].includes(item.slot))
    }
    
    return categories
  }

  const renderItem = (item) => {
    const isExotic = item.tier === 'Exotic'
    
    return (
      <div 
        key={item.hash}
        className={`inventory-item ${item.tier?.toLowerCase() || 'common'} ${isExotic ? 'clickable' : ''}`}
        onClick={() => handleItemClick(item)}
        title={isExotic ? 'Click to lock this exotic for builds' : ''}
      >
        <div className="item-header">
          <span className="item-name">{item.name}</span>
          <span className={`item-tier ${item.tier?.toLowerCase() || 'common'}`}>
            {item.tier || 'Common'}
          </span>
        </div>
        
        <div className="item-details">
          {item.description && (
            <p className="item-description">{item.description}</p>
          )}
          
          <div className="item-meta">
            {item.slot && (
              <span className="item-slot">{item.slot}</span>
            )}
            {item.type && (
              <span className="item-type">{item.type}</span>
            )}
            {item.classType && item.classType !== 'Any' && (
              <span className="item-class">{item.classType}</span>
            )}
            {item.powerLevel && (
              <span className="item-power">{item.powerLevel} Power</span>
            )}
          </div>
          
          {item.stats && Object.keys(item.stats).length > 0 && (
            <div className="item-stats">
              {Object.entries(item.stats).map(([stat, value]) => (
                <span key={stat} className="stat-pill">
                  {stat}: +{value}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {isExotic && (
          <div className="exotic-indicator">
            🔒 Click to use in builds
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner"></div>
        <span>Loading authentication...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="inventory-auth-required">
        <p>Please sign in to view your inventory</p>
      </div>
    )
  }

  if (isLoadingInventory) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner"></div>
        <span>Loading your inventory...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={loadUserInventory} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="inventory-empty">
        <p>No inventory data available</p>
        <button onClick={loadUserInventory} className="load-btn">
          Load Inventory
        </button>
      </div>
    )
  }

  const filteredItems = getFilteredItems()
  const categorizedItems = getItemsByCategory(filteredItems)

  return (
    <div className="user-inventory">
      <div className="inventory-header">
        <h3>Your Guardian Inventory</h3>
        <button onClick={loadUserInventory} className="refresh-btn" disabled={isLoadingInventory}>
          {isLoadingInventory ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Character Selection */}
      {inventory.characters && inventory.characters.length > 0 && (
        <div className="character-selector">
          <label>Character:</label>
          <select 
            value={selectedCharacter} 
            onChange={(e) => setSelectedCharacter(parseInt(e.target.value))}
          >
            {inventory.characters.map((char, index) => (
              <option key={char.characterId} value={index}>
                {char.className} (Power {char.powerLevel})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="exotic">Exotics Only</option>
            <option value="legendary">Legendaries Only</option>
            <option value="armor">Armor</option>
            <option value="weapons">Weapons</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="search-input"
          />
        </div>
      </div>

      {/* Items Display */}
      <div className="inventory-content">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <p>No items found matching your filters</p>
          </div>
        ) : (
          <div className="inventory-categories">
            {/* Exotics Section */}
            {categorizedItems.exotics.length > 0 && (
              <div className="category-section">
                <h4 
                  onClick={() => toggleCategory('exotics')}
                  className="category-header clickable"
                >
                  Exotic Items ({categorizedItems.exotics.length})
                  <span className="expand-icon">
                    {expandedCategories.exotics ? '▼' : '▶'}
                  </span>
                </h4>
                {expandedCategories.exotics && (
                  <div className="category-items">
                    {categorizedItems.exotics.map(renderItem)}
                  </div>
                )}
              </div>
            )}

            {/* Legendary Section */}
            {categorizedItems.legendaries.length > 0 && (
              <div className="category-section">
                <h4 
                  onClick={() => toggleCategory('legendaries')}
                  className="category-header clickable"
                >
                  Legendary Items ({categorizedItems.legendaries.length})
                  <span className="expand-icon">
                    {expandedCategories.legendaries ? '▼' : '▶'}
                  </span>
                </h4>
                {expandedCategories.legendaries && (
                  <div className="category-items">
                    {categorizedItems.legendaries.map(renderItem)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="inventory-instructions">
        <h4>How to Use</h4>
        <ul>
          <li>🔍 Use filters to find specific types of gear</li>
          <li>🔒 Click on exotic items to lock them for build generation</li>
          <li>📊 View item stats and power levels</li>
          <li>🔄 Refresh to get the latest data from Bungie</li>
        </ul>
      </div>
    </div>
  )
}