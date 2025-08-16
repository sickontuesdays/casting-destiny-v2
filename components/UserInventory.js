import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function UserInventory({ onItemSelected, onBuildApply }) {
  const { session, isLoading: authLoading } = useAuth()
  const [inventory, setInventory] = useState(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState({
    kinetic: null,
    energy: null,
    power: null,
    helmet: null,
    gauntlets: null,
    chest: null,
    legs: null,
    classItem: null
  })
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    if (session?.user && session.accessToken) {
      loadUserInventory()
    }
  }, [session])

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh || !session) return
    
    const interval = setInterval(() => {
      loadUserInventory(true)
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [autoRefresh, session])

  const loadUserInventory = async (silent = false) => {
    if (!session?.user || !session.accessToken) {
      setError('Authentication required to load inventory')
      return
    }

    if (!silent) {
      setIsLoadingInventory(true)
    }
    setError(null)

    try {
      console.log('Loading user inventory...')
      
      const response = await fetch('/api/bungie/inventory', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.')
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load inventory')
      }

      console.log('Inventory loaded successfully')
      console.log(`Characters: ${data.characters?.length || 0}`)
      console.log(`Vault items: ${Object.values(data.vault || {}).flat().length}`)
      console.log(`Friends: ${data.friends?.length || 0}`)
      
      setInventory(data)
      setLastRefresh(new Date())
      
      // Select first character by default
      if (data.characters?.length > 0 && selectedCharacter === 0) {
        setSelectedCharacter(0)
      }

    } catch (error) {
      console.error('Failed to load inventory:', error)
      setError(error.message)
    } finally {
      if (!silent) {
        setIsLoadingInventory(false)
      }
    }
  }

  const handleItemSelect = (item, slot) => {
    const newSelection = { ...selectedItems }
    newSelection[slot] = item
    setSelectedItems(newSelection)
    
    if (onItemSelected) {
      onItemSelected(newSelection)
    }
  }

  const handleApplyBuild = async () => {
    if (!selectedCharacter || !inventory?.characters?.[selectedCharacter]) {
      setError('Please select a character')
      return
    }

    const character = inventory.characters[selectedCharacter]
    const buildItems = Object.values(selectedItems).filter(item => item !== null)
    
    if (buildItems.length === 0) {
      setError('Please select items for your build')
      return
    }

    if (onBuildApply) {
      onBuildApply({
        character,
        items: selectedItems,
        timestamp: new Date().toISOString()
      })
    }
  }

  const filterItems = (items) => {
    if (!items || !Array.isArray(items)) return []
    
    return items.filter(item => {
      if (!item) return false
      
      // Filter by category
      if (filterCategory !== 'all') {
        if (filterCategory === 'exotic' && !item.isExotic) return false
        if (filterCategory === 'legendary' && !item.isLegendary) return false
        if (filterCategory === 'weapons' && item.itemType !== 3) return false
        if (filterCategory === 'armor' && item.itemType !== 2) return false
        if (filterCategory === 'mods' && item.itemType !== 19 && item.itemType !== 20) return false
      }
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const name = item.displayProperties?.name?.toLowerCase() || ''
        const description = item.displayProperties?.description?.toLowerCase() || ''
        
        if (!name.includes(search) && !description.includes(search)) {
          return false
        }
      }
      
      return true
    })
  }

  const renderCharacterSelect = () => {
    if (!inventory?.characters?.length) return null
    
    return (
      <div className="character-select">
        <label>Character:</label>
        <select 
          value={selectedCharacter} 
          onChange={(e) => setSelectedCharacter(parseInt(e.target.value))}
        >
          {inventory.characters.map((char, index) => (
            <option key={char.characterId} value={index}>
              {char.className} - Power {char.stats?.power || char.light || 0}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const renderInventoryStats = () => {
    if (!inventory) return null
    
    const character = inventory.characters?.[selectedCharacter]
    if (!character?.stats) return null
    
    return (
      <div className="character-stats">
        <h4>Character Stats</h4>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-name">Mobility:</span>
            <span className="stat-value">{character.stats.mobility || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-name">Resilience:</span>
            <span className="stat-value">{character.stats.resilience || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-name">Recovery:</span>
            <span className="stat-value">{character.stats.recovery || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-name">Discipline:</span>
            <span className="stat-value">{character.stats.discipline || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-name">Intellect:</span>
            <span className="stat-value">{character.stats.intellect || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-name">Strength:</span>
            <span className="stat-value">{character.stats.strength || 0}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderItem = (item, slot) => {
    if (!item) return null
    
    const isSelected = selectedItems[slot]?.itemInstanceId === item.itemInstanceId
    
    return (
      <div 
        key={item.itemInstanceId || item.itemHash}
        className={`inventory-item ${item.isExotic ? 'exotic' : ''} ${item.isLegendary ? 'legendary' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleItemSelect(item, slot)}
        title={item.displayProperties?.description}
      >
        {item.displayProperties?.icon && (
          <img 
            src={`https://www.bungie.net${item.displayProperties.icon}`} 
            alt={item.displayProperties?.name}
            className="item-icon"
          />
        )}
        <div className="item-info">
          <div className="item-name">{item.displayProperties?.name || 'Unknown Item'}</div>
          {item.powerLevel && (
            <div className="item-power">{item.powerLevel}</div>
          )}
        </div>
      </div>
    )
  }

  if (authLoading || isLoadingInventory) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="inventory-auth-required">
        <p>Please sign in to view your inventory</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-error">
        <p className="error-message">⚠️ {error}</p>
        <button onClick={() => loadUserInventory()} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="inventory-empty">
        <p>No inventory data available</p>
        <button onClick={() => loadUserInventory()} className="load-btn">
          Load Inventory
        </button>
      </div>
    )
  }

  const character = inventory.characters?.[selectedCharacter]
  const allItems = [
    ...(character?.equipment || []),
    ...(character?.inventory || []),
    ...Object.values(inventory.vault || {}).flat()
  ]
  
  const filteredItems = filterItems(allItems)

  return (
    <div className="user-inventory">
      <div className="inventory-header">
        <h3>Inventory</h3>
        <div className="inventory-controls">
          {renderCharacterSelect()}
          <button 
            onClick={() => loadUserInventory()} 
            className="refresh-btn"
            disabled={isLoadingInventory}
          >
            🔄 Refresh
          </button>
          <label className="auto-refresh">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
        {lastRefresh && (
          <div className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      {renderInventoryStats()}

      <div className="inventory-filters">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Items</option>
          <option value="exotic">Exotic</option>
          <option value="legendary">Legendary</option>
          <option value="weapons">Weapons</option>
          <option value="armor">Armor</option>
          <option value="mods">Mods</option>
        </select>
      </div>

      <div className="inventory-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => {
            // Determine slot based on item type
            let slot = 'other'
            if (item.itemType === 2) { // Armor
              switch (item.itemSubType) {
                case 26: slot = 'helmet'; break
                case 27: slot = 'gauntlets'; break
                case 28: slot = 'chest'; break
                case 29: slot = 'legs'; break
                case 30: slot = 'classItem'; break
              }
            } else if (item.itemType === 3) { // Weapon
              switch (item.itemSubType) {
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                  slot = 'kinetic'; break
                case 11:
                case 12:
                case 13:
                  slot = 'energy'; break
                case 18:
                case 19:
                case 20:
                case 21:
                  slot = 'power'; break
              }
            }
            
            return renderItem(item, slot)
          })
        ) : (
          <p className="no-items">No items found</p>
        )}
      </div>

      {Object.values(selectedItems).some(item => item !== null) && (
        <div className="build-actions">
          <button 
            onClick={handleApplyBuild}
            className="apply-build-btn"
          >
            Apply Build to Character
          </button>
          <button 
            onClick={() => setSelectedItems({
              kinetic: null, energy: null, power: null,
              helmet: null, gauntlets: null, chest: null,
              legs: null, classItem: null
            })}
            className="clear-btn"
          >
            Clear Selection
          </button>
        </div>
      )}

      {inventory.friends?.length > 0 && (
        <div className="inventory-footer">
          <p className="friends-count">
            {inventory.friends.length} friends available for build sharing
          </p>
        </div>
      )}
    </div>
  )
}