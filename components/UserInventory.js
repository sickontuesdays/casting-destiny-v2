// components/UserInventory.js
// Component for displaying user's Destiny 2 inventory

import { useState, useEffect } from 'react'

export default function UserInventory({ session, manifest, onItemSelect, onLoadComplete }) {
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedClass, setSelectedClass] = useState(null)

  useEffect(() => {
    if (session && manifest) {
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
      
      const response = await fetch(`/api/bungie/inventory?membershipType=${membershipType}&membershipId=${membershipId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load inventory')
      }
      
      const data = await response.json()
      setInventory(data)
      
      if (onLoadComplete) {
        onLoadComplete()
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
    
    // Filter by type
    if (filter === 'armor') {
      filtered = filtered.filter(item => item.itemType === 2)
    } else if (filter === 'weapons') {
      filtered = filtered.filter(item => item.itemType === 3)
    } else if (filter === 'exotics') {
      filtered = filtered.filter(item => item.tierType === 6)
    }
    
    // Filter by class if selected
    if (selectedClass !== null) {
      filtered = filtered.filter(item => 
        item.classType === selectedClass || item.classType === 3
      )
    }
    
    return filtered
  }

  if (loading) {
    return (
      <div className="user-inventory loading">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-inventory error">
        <p>Error: {error}</p>
        <button onClick={loadInventory}>Retry</button>
      </div>
    )
  }

  const items = filterItems(inventory?.items)

  return (
    <div className="user-inventory">
      <div className="inventory-header">
        <h3>Your Inventory</h3>
        <button className="refresh-btn" onClick={loadInventory}>
          🔄
        </button>
      </div>

      <div className="filter-controls">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'armor' ? 'active' : ''}
            onClick={() => setFilter('armor')}
          >
            Armor
          </button>
          <button 
            className={filter === 'weapons' ? 'active' : ''}
            onClick={() => setFilter('weapons')}
          >
            Weapons
          </button>
          <button 
            className={filter === 'exotics' ? 'active' : ''}
            onClick={() => setFilter('exotics')}
          >
            Exotics
          </button>
        </div>

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
            Titan
          </button>
          <button 
            className={selectedClass === 1 ? 'active' : ''}
            onClick={() => setSelectedClass(1)}
          >
            Hunter
          </button>
          <button 
            className={selectedClass === 2 ? 'active' : ''}
            onClick={() => setSelectedClass(2)}
          >
            Warlock
          </button>
        </div>
      </div>

      <div className="inventory-grid">
        {items && items.length > 0 ? (
          items.map(item => (
            <div 
              key={item.instanceId || item.itemHash}
              className="inventory-item"
              onClick={() => onItemSelect && onItemSelect(item)}
            >
              {item.icon && (
                <img src={item.icon} alt={item.name} />
              )}
              <div className="item-overlay">
                <div className="item-name">{item.name}</div>
                <div className="item-power">{item.power} ⚡</div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">
            <p>No items found</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .user-inventory {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 8px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .user-inventory.loading,
        .user-inventory.error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          flex-direction: column;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 107, 53, 0.3);
          border-radius: 50%;
          border-top-color: #ff6b35;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid #333;
        }

        .inventory-header h3 {
          margin: 0;
          color: #ff6b35;
        }

        .refresh-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .filter-controls {
          padding: 12px 20px;
          border-bottom: 1px solid #333;
        }

        .filter-tabs,
        .class-filter {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .filter-tabs button,
        .class-filter button {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          color: #999;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .filter-tabs button.active,
        .class-filter button.active {
          background: rgba(255, 107, 53, 0.2);
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .inventory-grid {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }

        .inventory-item {
          position: relative;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          border-radius: 4px;
          aspect-ratio: 1;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
        }

        .inventory-item:hover {
          border-color: #ff6b35;
          transform: scale(1.05);
        }

        .inventory-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
          padding: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .inventory-item:hover .item-overlay {
          opacity: 1;
        }

        .item-name {
          font-size: 10px;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-power {
          font-size: 10px;
          color: #4fc3f7;
        }

        .no-items {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error button {
          background: #ff6b35;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}