import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getUserInventory } from '../lib/bungie-api'

export default function UserInventory() {
  const { data: session } = useSession()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (session) {
      loadInventory()
    }
  }, [session, selectedCharacter])

  const loadInventory = async () => {
    if (!session?.destinyMemberships?.length) {
      setLoading(false)
      return
    }

    try {
      const membershipType = session.destinyMemberships[0].membershipType
      const destinyMembershipId = session.destinyMemberships[0].membershipId
      
      const inventoryData = await getUserInventory(
        session.accessToken,
        membershipType,
        destinyMembershipId
      )
      
      setInventory(inventoryData)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredItems = () => {
    if (!inventory) return []

    let items = []
    
    // Get items from selected character and vault
    if (inventory.characters && inventory.characters[selectedCharacter]) {
      items = [...inventory.characters[selectedCharacter].items]
    }
    
    if (inventory.vault) {
      items = [...items, ...inventory.vault.items]
    }

    // Apply filter
    if (filter !== 'all') {
      if (filter === 'weapons') {
        items = items.filter(item => item.itemType === 'weapon')
      } else if (filter === 'armor') {
        items = items.filter(item => item.itemType === 'armor')
      } else if (filter === 'exotics') {
        items = items.filter(item => item.tierType === 6)
      }
    }

    // Apply search
    if (searchTerm) {
      items = items.filter(item =>
        item.displayProperties.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return items
  }

  if (loading) {
    return (
      <div className="inventory-sidebar">
        <div className="inventory-header">
          <h3>Your Inventory</h3>
        </div>
        <div className="inventory-loading">
          <div className="loading-spinner"></div>
          <p>Loading your gear...</p>
        </div>
      </div>
    )
  }

  if (!inventory || !session?.destinyMemberships?.length) {
    return (
      <div className="inventory-sidebar">
        <div className="inventory-header">
          <h3>Your Inventory</h3>
        </div>
        <div className="inventory-error">
          <p>Unable to load inventory. Make sure your Destiny 2 profile is public.</p>
        </div>
      </div>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="inventory-sidebar">
      <div className="inventory-header">
        <h3>Your Inventory</h3>
        <button 
          className="refresh-inventory"
          onClick={loadInventory}
          disabled={loading}
        >
          ↻
        </button>
      </div>

      {inventory.characters && inventory.characters.length > 0 && (
        <div className="character-selector">
          <label>Character:</label>
          <select 
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(parseInt(e.target.value))}
          >
            {inventory.characters.map((character, index) => (
              <option key={index} value={index}>
                {character.class} - {character.light}
              </option>
            ))}
            <option value="vault">Vault</option>
          </select>
        </div>
      )}

      <div className="inventory-filters">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'weapons' ? 'active' : ''}
            onClick={() => setFilter('weapons')}
          >
            Weapons
          </button>
          <button 
            className={filter === 'armor' ? 'active' : ''}
            onClick={() => setFilter('armor')}
          >
            Armor
          </button>
          <button 
            className={filter === 'exotics' ? 'active' : ''}
            onClick={() => setFilter('exotics')}
          >
            Exotics
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="inventory-search"
          />
        </div>
      </div>

      <div className="inventory-items">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <p>No items found</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item, index) => (
              <div 
                key={`${item.hash}-${index}`}
                className={`inventory-item ${item.tierType === 6 ? 'exotic' : ''}`}
                title={item.displayProperties.name}
              >
                <div className="item-icon">
                  <img 
                    src={`https://www.bungie.net${item.displayProperties.icon}`}
                    alt={item.displayProperties.name}
                  />
                  {item.masterwork && (
                    <div className="masterwork-indicator">★</div>
                  )}
                </div>
                <div className="item-info">
                  <div className="item-name">{item.displayProperties.name}</div>
                  <div className="item-type">{item.itemTypeDisplayName}</div>
                  {item.powerLevel && (
                    <div className="power-level">{item.powerLevel}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="inventory-stats">
        <div className="stat-item">
          <span>Total Items:</span>
          <span>{filteredItems.length}</span>
        </div>
        <div className="stat-item">
          <span>Exotics:</span>
          <span>{filteredItems.filter(item => item.tierType === 6).length}</span>
        </div>
      </div>
    </div>
  )
}