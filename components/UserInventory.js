// components/UserInventory.js
// Component for displaying user's Destiny 2 inventory with advanced filtering

import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from '../pages/_app'
import Image from 'next/image'

export default function UserInventory({ onItemSelect, onLoadComplete, selectedExotic }) {
  const { session } = useAuth()
  const { manifest } = useContext(AppContext)
  
  const [inventory, setInventory] = useState(null)
  const [characters, setCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedClass, setSelectedClass] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load inventory when authenticated with manifest data
  useEffect(() => {
    if (session?.user && manifest) {
      loadInventory()
    }
  }, [session, manifest])

  const loadInventory = async () => {
    if (!session?.primaryMembership) {
      setError('No Destiny membership found')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { membershipType, membershipId } = session.primaryMembership
      
      // Load inventory from API
      const response = await fetch(`/api/bungie/inventory?membershipType=${membershipType}&membershipId=${membershipId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load inventory')
      }
      
      const data = await response.json()
      setInventory(data)
      setCharacters(data.characters || [])
      
      if (onLoadComplete) {
        onLoadComplete(data)
      }
      
    } catch (error) {
      console.error('Error loading inventory:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = (items) => {
    if (!items) return []
    
    let filtered = [...items]
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.typeName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by item type
    if (filter === 'armor') {
      filtered = filtered.filter(item => 
        item.itemType === 2 || 
        item.itemCategoryHashes?.includes(20) // Armor category
      )
    } else if (filter === 'weapons') {
      filtered = filtered.filter(item => 
        item.itemType === 3 ||
        item.itemCategoryHashes?.includes(1) // Weapon category
      )
    } else if (filter === 'exotics') {
      filtered = filtered.filter(item => 
        item.tierType === 6 || 
        item.inventory?.tierTypeName === 'Exotic'
      )
    }
    
    // Filter by class if selected
    if (selectedClass !== null) {
      filtered = filtered.filter(item => 
        item.classType === selectedClass || 
        item.classType === 3 || // Universal items
        !item.classType // Items without class restriction
      )
    }
    
    // Filter by character if selected
    if (selectedCharacter && selectedCharacter !== 'all') {
      filtered = filtered.filter(item => 
        item.characterId === selectedCharacter ||
        item.location === 'vault'
      )
    }
    
    return filtered
  }

  const getItemIcon = (item) => {
    if (!item) return '/icons/empty_slot.png'
    
    // Try multiple sources for the icon
    if (item.displayProperties?.icon) {
      return `https://www.bungie.net${item.displayProperties.icon}`
    }
    if (item.icon) {
      return item.icon.startsWith('http') ? item.icon : `https://www.bungie.net${item.icon}`
    }
    
    return '/icons/default_item.png'
  }

  const getTierColor = (item) => {
    if (!item) return '#c9c9c9'
    
    const tier = item.tierType || item.inventory?.tierType
    
    switch (tier) {
      case 6:
      case 'Exotic':
        return '#ceae33'
      case 5:
      case 'Legendary':
        return '#522f65'
      case 4:
      case 'Rare':
        return '#5076a3'
      case 3:
      case 'Uncommon':
        return '#366f36'
      case 2:
      case 'Common':
        return '#c9c9c9'
      default:
        return '#c9c9c9'
    }
  }

  const getClassIcon = (classType) => {
    switch (classType) {
      case 0: return '🛡️' // Titan
      case 1: return '🏹' // Hunter  
      case 2: return '⚡' // Warlock
      default: return '🔄' // Universal
    }
  }

  const handleItemClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item)
    }
  }

  const handleRefresh = () => {
    loadInventory()
  }

  // Show loading state
  if (loading && !inventory) {
    return (
      <div className="user-inventory">
        <div className="inventory-loading">
          <div className="loading-spinner"></div>
          <p>Loading your inventory...</p>
        </div>
      </div>
    )
  }

  // Show authentication required
  if (!session?.user) {
    return (
      <div className="user-inventory">
        <div className="inventory-auth-required">
          <p>Sign in with Bungie.net to view your inventory</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="user-inventory">
        <div className="inventory-error">
          <div className="error-content">
            <p>Error loading inventory: {error}</p>
            <button onClick={handleRefresh} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const items = filterItems(inventory?.items || [])

  return (
    <div className="user-inventory">
      <div className="inventory-header">
        <h3>Your Inventory</h3>
        <button 
          className="refresh-btn" 
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh inventory"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Character Selector */}
      {characters.length > 0 && (
        <div className="character-selector">
          <label>Character:</label>
          <select 
            value={selectedCharacter} 
            onChange={(e) => setSelectedCharacter(e.target.value)}
          >
            <option value="all">All Characters</option>
            {characters.map(char => (
              <option key={char.characterId} value={char.characterId}>
                {char.className} - {char.lightLevel} ⚡
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group">
          <label>Item Type</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Items</option>
            <option value="weapons">Weapons</option>
            <option value="armor">Armor</option>
            <option value="exotics">Exotics Only</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Class Filter Buttons */}
      <div className="class-filter">
        <button 
          className={selectedClass === null ? 'active' : ''}
          onClick={() => setSelectedClass(null)}
        >
          All Classes
        </button>
        <button 
          className={selectedClass === 0 ? 'active' : ''}
          onClick={() => setSelectedClass(0)}
        >
          🛡️ Titan
        </button>
        <button 
          className={selectedClass === 1 ? 'active' : ''}
          onClick={() => setSelectedClass(1)}
        >
          🏹 Hunter
        </button>
        <button 
          className={selectedClass === 2 ? 'active' : ''}
          onClick={() => setSelectedClass(2)}
        >
          ⚡ Warlock
        </button>
      </div>

      {/* Inventory Grid */}
      <div className="inventory-content">
        {items.length === 0 ? (
          <div className="inventory-empty">
            <p>No items found matching your filters</p>
            {filter !== 'all' || searchTerm || selectedClass !== null ? (
              <button 
                onClick={() => {
                  setFilter('all')
                  setSearchTerm('')
                  setSelectedClass(null)
                }}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="inventory-categories">
            {/* Group items by category for better organization */}
            {filter === 'all' && (
              <>
                {/* Exotics Section */}
                {items.filter(item => item.tierType === 6).length > 0 && (
                  <div className="inventory-category">
                    <div className="category-header">
                      <h4>Exotic Items ({items.filter(item => item.tierType === 6).length})</h4>
                    </div>
                    <div className="inventory-grid">
                      {items
                        .filter(item => item.tierType === 6)
                        .slice(0, 20)
                        .map(item => (
                          <div 
                            key={item.instanceId || `${item.itemHash}-${Math.random()}`}
                            className={`inventory-item ${item.itemHash === selectedExotic?.itemHash ? 'selected' : ''}`}
                            onClick={() => handleItemClick(item)}
                            title={`${item.name} - ${item.typeName || 'Unknown'}`}
                          >
                            <div className="item-icon-container">
                              <img
                                src={getItemIcon(item)}
                                alt={item.name || 'Item'}
                                width={60}
                                height={60}
                                className="item-icon"
                                style={{
                                  border: `2px solid ${getTierColor(item)}`
                                }}
                              />
                              <div className="item-overlay">
                                <div className="item-power">
                                  {item.power || item.basePower || ''}
                                </div>
                                <div className="item-class">
                                  {getClassIcon(item.classType)}
                                </div>
                              </div>
                            </div>
                            <div className="item-details">
                              <div className="item-name">{item.name}</div>
                              <div className="item-type">{item.typeName}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Legendary Items Section */}
                {items.filter(item => item.tierType === 5).length > 0 && (
                  <div className="inventory-category">
                    <div className="category-header">
                      <h4>Legendary Items ({items.filter(item => item.tierType === 5).length})</h4>
                    </div>
                    <div className="inventory-grid">
                      {items
                        .filter(item => item.tierType === 5)
                        .slice(0, 30)
                        .map(item => (
                          <div 
                            key={item.instanceId || `${item.itemHash}-${Math.random()}`}
                            className="inventory-item"
                            onClick={() => handleItemClick(item)}
                            title={`${item.name} - ${item.typeName || 'Unknown'}`}
                          >
                            <div className="item-icon-container">
                              <img
                                src={getItemIcon(item)}
                                alt={item.name || 'Item'}
                                width={50}
                                height={50}
                                className="item-icon"
                                style={{
                                  border: `2px solid ${getTierColor(item)}`
                                }}
                              />
                              <div className="item-overlay">
                                <div className="item-power">
                                  {item.power || item.basePower || ''}
                                </div>
                                <div className="item-class">
                                  {getClassIcon(item.classType)}
                                </div>
                              </div>
                            </div>
                            <div className="item-details">
                              <div className="item-name">{item.name}</div>
                              <div className="item-type">{item.typeName}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Single Category View */}
            {filter !== 'all' && (
              <div className="inventory-category">
                <div className="category-header">
                  <h4>{filter.charAt(0).toUpperCase() + filter.slice(1)} ({items.length})</h4>
                </div>
                <div className="inventory-grid">
                  {items.slice(0, 50).map(item => (
                    <div 
                      key={item.instanceId || `${item.itemHash}-${Math.random()}`}
                      className={`inventory-item ${item.itemHash === selectedExotic?.itemHash ? 'selected' : ''}`}
                      onClick={() => handleItemClick(item)}
                      title={`${item.name} - ${item.typeName || 'Unknown'}`}
                    >
                      <div className="item-icon-container">
                        <img
                          src={getItemIcon(item)}
                          alt={item.name || 'Item'}
                          width={50}
                          height={50}
                          className="item-icon"
                          style={{
                            border: `2px solid ${getTierColor(item)}`
                          }}
                        />
                        <div className="item-overlay">
                          <div className="item-power">
                            {item.power || item.basePower || ''}
                          </div>
                          <div className="item-class">
                            {getClassIcon(item.classType)}
                          </div>
                        </div>
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-type">{item.typeName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}