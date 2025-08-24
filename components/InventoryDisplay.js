import { useState, useMemo } from 'react'

export default function InventoryDisplay({ inventory, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState('characters')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRarity, setFilterRarity] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedCharacter, setSelectedCharacter] = useState(0)

  // Memoized filtered items for performance
  const filteredItems = useMemo(() => {
    if (!inventory) return []

    let items = []

    // Get items based on active tab
    switch (activeTab) {
      case 'characters':
        if (inventory.characters?.[selectedCharacter]) {
          const character = inventory.characters[selectedCharacter]
          items = [...(character.equipment || []), ...(character.inventory || [])]
        }
        break
      case 'vault':
        items = [
          ...(inventory.vault?.weapons || []),
          ...(inventory.vault?.armor || []),
          ...(inventory.vault?.consumables || []),
          ...(inventory.vault?.mods || []),
          ...(inventory.vault?.other || [])
        ]
        break
      case 'weapons':
        items = [
          ...(inventory.vault?.weapons || []),
          ...(inventory.characters?.flatMap(char => 
            [...(char.equipment || []), ...(char.inventory || [])]
          ).filter(item => item.itemType === 3) || [])
        ]
        break
      case 'armor':
        items = [
          ...(inventory.vault?.armor || []),
          ...(inventory.characters?.flatMap(char => 
            [...(char.equipment || []), ...(char.inventory || [])]
          ).filter(item => item.itemType === 2) || [])
        ]
        break
    }

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item => 
        item.displayProperties?.name?.toLowerCase().includes(query) ||
        item.displayProperties?.description?.toLowerCase().includes(query)
      )
    }

    if (filterRarity !== 'all') {
      const rarityMap = {
        exotic: 6,
        legendary: 5,
        rare: 4,
        uncommon: 3,
        common: 2
      }
      items = items.filter(item => item.tierType === rarityMap[filterRarity])
    }

    if (filterType !== 'all') {
      const typeMap = {
        weapons: 3,
        armor: 2,
        consumables: 9,
        mods: [19, 20]
      }
      const targetType = typeMap[filterType]
      if (Array.isArray(targetType)) {
        items = items.filter(item => targetType.includes(item.itemType))
      } else {
        items = items.filter(item => item.itemType === targetType)
      }
    }

    return items
  }, [inventory, activeTab, selectedCharacter, searchQuery, filterRarity, filterType])

  const renderCharacterSelector = () => {
    if (!inventory.characters?.length) return null

    return (
      <div className="character-selector">
        <label>Character:</label>
        <select 
          value={selectedCharacter} 
          onChange={(e) => setSelectedCharacter(parseInt(e.target.value))}
        >
          {inventory.characters.map((character, index) => (
            <option key={character.characterId} value={index}>
              {character.className} - {character.raceName} {character.genderName} (Light {character.light})
            </option>
          ))}
        </select>
      </div>
    )
  }

  const renderFilters = () => (
    <div className="inventory-filters">
      <div className="filter-group">
        <label>Search:</label>
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-group">
        <label>Rarity:</label>
        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
          <option value="all">All Rarities</option>
          <option value="exotic">Exotic</option>
          <option value="legendary">Legendary</option>
          <option value="rare">Rare</option>
          <option value="uncommon">Uncommon</option>
          <option value="common">Common</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Type:</label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="weapons">Weapons</option>
          <option value="armor">Armor</option>
          <option value="consumables">Consumables</option>
          <option value="mods">Mods</option>
        </select>
      </div>
    </div>
  )

  const renderItem = (item) => {
    if (!item) return null

    const getRarityClass = (tierType) => {
      switch (tierType) {
        case 6: return 'exotic'
        case 5: return 'legendary'
        case 4: return 'rare'
        case 3: return 'uncommon'
        case 2: return 'common'
        default: return ''
      }
    }

    const getRarityName = (tierType) => {
      switch (tierType) {
        case 6: return 'Exotic'
        case 5: return 'Legendary'
        case 4: return 'Rare'
        case 3: return 'Uncommon'
        case 2: return 'Common'
        default: return 'Unknown'
      }
    }

    const getItemTypeName = (itemType) => {
      switch (itemType) {
        case 2: return 'Armor'
        case 3: return 'Weapon'
        case 9: return 'Consumable'
        case 19: return 'Mod'
        case 20: return 'Armor Mod'
        default: return 'Item'
      }
    }

    return (
      <div 
        key={item.itemInstanceId || item.itemHash} 
        className={`inventory-item ${getRarityClass(item.tierType)}`}
        title={item.displayProperties?.description}
      >
        <div className="item-header">
          <div className="item-name">{item.displayProperties?.name || 'Unknown Item'}</div>
          {item.primaryStat && (
            <div className="item-light">{item.primaryStat.value}</div>
          )}
        </div>
        
        <div className="item-details">
          <div className="item-type">{getItemTypeName(item.itemType)}</div>
          <div className="item-rarity">{getRarityName(item.tierType)}</div>
          {item.quantity > 1 && (
            <div className="item-quantity">x{item.quantity}</div>
          )}
        </div>

        {item.stats && Object.keys(item.stats).length > 0 && (
          <div className="item-stats">
            {Object.entries(item.stats).slice(0, 3).map(([statHash, stat]) => (
              <div key={statHash} className="stat-item">
                <span className="stat-name">{stat.name}:</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCurrencies = () => {
    if (!inventory.currencies?.length) return null

    return (
      <div className="currencies-section">
        <h3>Currencies</h3>
        <div className="currencies-grid">
          {inventory.currencies.map(currency => (
            <div key={currency.itemHash} className="currency-item">
              <div className="currency-name">{currency.displayProperties?.name}</div>
              <div className="currency-amount">{currency.quantity?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderInventorySummary = () => {
    if (!inventory) return null

    const totalItems = filteredItems.length
    const exoticCount = filteredItems.filter(item => item.tierType === 6).length
    const legendaryCount = filteredItems.filter(item => item.tierType === 5).length
    
    return (
      <div className="inventory-summary">
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Total Items</span>
            <span className="summary-value">{totalItems}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Exotics</span>
            <span className="summary-value exotic">{exoticCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Legendaries</span>
            <span className="summary-value legendary">{legendaryCount}</span>
          </div>
          {inventory.characters && (
            <div className="summary-item">
              <span className="summary-label">Characters</span>
              <span className="summary-value">{inventory.characters.length}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!inventory) return null

  return (
    <div className="inventory-display">
      {/* Navigation Tabs */}
      <div className="inventory-tabs">
        <button 
          className={`tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          Characters ({inventory.characters?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveTab('vault')}
        >
          Vault ({Object.values(inventory.vault || {}).reduce((sum, items) => sum + (items?.length || 0), 0)})
        </button>
        <button 
          className={`tab ${activeTab === 'weapons' ? 'active' : ''}`}
          onClick={() => setActiveTab('weapons')}
        >
          All Weapons
        </button>
        <button 
          className={`tab ${activeTab === 'armor' ? 'active' : ''}`}
          onClick={() => setActiveTab('armor')}
        >
          All Armor
        </button>
      </div>

      {/* Character Selector */}
      {activeTab === 'characters' && renderCharacterSelector()}

      {/* Filters */}
      {renderFilters()}

      {/* Summary */}
      {renderInventorySummary()}

      {/* Items Grid */}
      <div className="inventory-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Refreshing...</span>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="no-items">
            <h3>No items found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(renderItem)}
          </div>
        )}
      </div>

      {/* Currencies */}
      {activeTab === 'vault' && renderCurrencies()}

      {/* Character Details */}
      {activeTab === 'characters' && inventory.characters?.[selectedCharacter] && (
        <div className="character-details">
          <h3>Character Details</h3>
          <div className="character-stats">
            <div className="char-stat">
              <span>Light Level:</span>
              <span>{inventory.characters[selectedCharacter].light}</span>
            </div>
            <div className="char-stat">
              <span>Class:</span>
              <span>{inventory.characters[selectedCharacter].className}</span>
            </div>
            <div className="char-stat">
              <span>Race:</span>
              <span>{inventory.characters[selectedCharacter].raceName}</span>
            </div>
            <div className="char-stat">
              <span>Gender:</span>
              <span>{inventory.characters[selectedCharacter].genderName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}