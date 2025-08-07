import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../pages/_app'

export default function BuildCreator({ onExoticSelected, selectedExotic }) {
  const { manifest } = useContext(AppContext)
  const [exoticType, setExoticType] = useState('')
  const [availableExotics, setAvailableExotics] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (manifest && exoticType) {
      loadExotics()
    }
  }, [manifest, exoticType])

  const loadExotics = () => {
    if (!manifest) return

    let exotics = []
    
    if (exoticType === 'armor') {
      exotics = Object.values(manifest.armor || {})
        .filter(item => item.tierType === 6) // Exotic tier
        .sort((a, b) => a.displayProperties.name.localeCompare(b.displayProperties.name))
    } else if (exoticType === 'weapon') {
      exotics = Object.values(manifest.weapons || {})
        .filter(item => item.tierType === 6) // Exotic tier
        .sort((a, b) => a.displayProperties.name.localeCompare(b.displayProperties.name))
    }

    if (searchTerm) {
      exotics = exotics.filter(exotic =>
        exotic.displayProperties.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setAvailableExotics(exotics)
  }

  const handleExoticSelect = (exotic) => {
    onExoticSelected(exotic)
  }

  const clearSelection = () => {
    onExoticSelected(null)
    setExoticType('')
    setSearchTerm('')
  }

  if (selectedExotic) {
    return (
      <div className="exotic-locked">
        <div className="locked-exotic-display">
          <div className="exotic-icon">
            <img 
              src={`https://www.bungie.net${selectedExotic.displayProperties.icon}`}
              alt={selectedExotic.displayProperties.name}
            />
          </div>
          <div className="exotic-info">
            <h3>{selectedExotic.displayProperties.name}</h3>
            <p>{selectedExotic.displayProperties.description}</p>
            <div className="exotic-perk">
              {selectedExotic.intrinsicSockets && (
                <p><strong>Exotic Perk:</strong> {selectedExotic.intrinsicSockets[0]?.displayProperties?.name}</p>
              )}
            </div>
          </div>
          <button className="clear-exotic" onClick={clearSelection}>
            Change Exotic
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="build-creator">
      <div className="exotic-selector">
        <h3>Build Around an Exotic (Optional)</h3>
        <p>Select an exotic armor piece or weapon to center your build around</p>
        
        <div className="exotic-type-selector">
          <button 
            className={`type-btn ${exoticType === 'armor' ? 'active' : ''}`}
            onClick={() => setExoticType('armor')}
          >
            Exotic Armor
          </button>
          <button 
            className={`type-btn ${exoticType === 'weapon' ? 'active' : ''}`}
            onClick={() => setExoticType('weapon')}
          >
            Exotic Weapons
          </button>
        </div>

        {exoticType && (
          <div className="exotic-search">
            <input
              type="text"
              placeholder={`Search ${exoticType === 'armor' ? 'exotic armor' : 'exotic weapons'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="exotic-search-input"
            />
          </div>
        )}

        {availableExotics.length > 0 && (
          <div className="exotic-grid">
            {availableExotics.map(exotic => (
              <div 
                key={exotic.hash}
                className="exotic-card"
                onClick={() => handleExoticSelect(exotic)}
              >
                <div className="exotic-icon">
                  <img 
                    src={`https://www.bungie.net${exotic.displayProperties.icon}`}
                    alt={exotic.displayProperties.name}
                  />
                </div>
                <div className="exotic-name">
                  {exotic.displayProperties.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}