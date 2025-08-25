// components/BuildDisplay.js
// Component for displaying generated builds with expand/collapse functionality

import { useState } from 'react'
import Image from 'next/image'

export default function BuildDisplay({ builds, onLoadMore, onItemChange, isGenerating }) {
  const [expandedBuilds, setExpandedBuilds] = useState(new Set())
  const [editingSlots, setEditingSlots] = useState({})

  const toggleBuildExpansion = (buildIndex) => {
    const newExpanded = new Set(expandedBuilds)
    if (newExpanded.has(buildIndex)) {
      newExpanded.delete(buildIndex)
    } else {
      newExpanded.add(buildIndex)
    }
    setExpandedBuilds(newExpanded)
  }

  const handleItemEdit = (buildIndex, slot) => {
    const editKey = `${buildIndex}-${slot}`
    setEditingSlots(prev => ({
      ...prev,
      [editKey]: !prev[editKey]
    }))
  }

  const handleItemChange = (buildIndex, slot, newItem) => {
    onItemChange(buildIndex, slot, newItem)
    const editKey = `${buildIndex}-${slot}`
    setEditingSlots(prev => ({
      ...prev,
      [editKey]: false
    }))
  }

  const getItemIcon = (item) => {
    if (!item) return '/icons/empty_slot.png'
    return item.icon ? `https://www.bungie.net${item.icon}` : '/icons/default_item.png'
  }

  const getSubclassIcon = (subclass) => {
    const icons = {
      arc: '/icons/arc.png',
      solar: '/icons/solar.png',
      void: '/icons/void.png',
      stasis: '/icons/stasis.png',
      strand: '/icons/strand.png',
      prismatic: '/icons/prismatic.png'
    }
    return icons[subclass] || '/icons/kinetic.png'
  }

  const getTierColor = (tier) => {
    if (tier === 'Exotic' || tier === 6) return '#ceae33'
    if (tier === 'Legendary' || tier === 5) return '#522f65'
    if (tier === 'Rare' || tier === 4) return '#5076a3'
    return '#c9c9c9'
  }

  const formatStatValue = (value) => {
    const tiers = Math.floor(value / 10)
    return {
      value,
      tiers,
      color: tiers >= 10 ? '#ffd700' : tiers >= 8 ? '#90ee90' : tiers >= 5 ? '#ffffff' : '#888888'
    }
  }

  return (
    <div className="builds-display">
      {builds.length === 0 ? (
        <div className="no-builds">
          <p>No builds generated yet. Use the form above to create your perfect loadout!</p>
        </div>
      ) : (
        <>
          <div className="builds-header">
            <h3>Generated Builds ({builds.length})</h3>
            <p className="builds-hint">Click on a build to expand details • Click items to customize</p>
          </div>

          <div className="builds-list">
            {builds.map((build, index) => {
              const isExpanded = expandedBuilds.has(index)
              const confidence = build.confidence || 0
              const score = build.score || 0

              return (
                <div key={index} className={`build-card ${isExpanded ? 'expanded' : ''}`}>
                  {/* Build Header - Always Visible */}
                  <div 
                    className="build-header"
                    onClick={() => toggleBuildExpansion(index)}
                  >
                    <div className="build-title">
                      <img 
                        src={getSubclassIcon(build.subclass)} 
                        alt={build.subclass}
                        className="subclass-icon"
                      />
                      <h4>{build.name}</h4>
                      <span className="build-rank">#{index + 1}</span>
                    </div>

                    <div className="build-summary">
                      <div className="build-score">
                        <span className="score-value">{score}</span>
                        <span className="score-label">Score</span>
                      </div>
                      <div className="build-confidence">
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className="confidence-label">{confidence}% Match</span>
                      </div>
                    </div>

                    {/* Compact View - Equipment Icons */}
                    {!isExpanded && (
                      <div className="build-equipment-compact">
                        <div className="weapons-compact">
                          {['kinetic', 'energy', 'power'].map(slot => (
                            <div key={slot} className="item-icon">
                              <img 
                                src={getItemIcon(build[slot])}
                                alt={slot}
                                style={{ 
                                  borderColor: getTierColor(build[slot]?.tierType) 
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="armor-compact">
                          {['helmet', 'arms', 'chest', 'legs', 'classItem'].map(slot => (
                            <div key={slot} className="item-icon">
                              <img 
                                src={getItemIcon(build[slot])}
                                alt={slot}
                                style={{ 
                                  borderColor: getTierColor(build[slot]?.tierType) 
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className="expand-toggle">
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* Expanded View - Full Details */}
                  {isExpanded && (
                    <div className="build-details">
                      {/* Stats Display */}
                      <div className="build-stats">
                        <h5>Stats Distribution</h5>
                        <div className="stats-grid">
                          {Object.entries(build.stats || {}).map(([stat, value]) => {
                            const formatted = formatStatValue(value)
                            return (
                              <div key={stat} className="stat-item">
                                <span className="stat-name">{stat}</span>
                                <div className="stat-bar">
                                  <div 
                                    className="stat-fill"
                                    style={{ 
                                      width: `${value}%`,
                                      backgroundColor: formatted.color 
                                    }}
                                  />
                                </div>
                                <span 
                                  className="stat-value"
                                  style={{ color: formatted.color }}
                                >
                                  {formatted.tiers}0 ({value})
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Weapons Section */}
                      <div className="build-weapons">
                        <h5>Weapons</h5>
                        <div className="items-grid">
                          {['kinetic', 'energy', 'power'].map(slot => {
                            const item = build[slot]
                            const editKey = `${index}-${slot}`
                            const isEditing = editingSlots[editKey]

                            return (
                              <div key={slot} className="item-slot">
                                <div className="item-header">
                                  <span className="slot-name">{slot}</span>
                                  <button 
                                    className="change-btn"
                                    onClick={() => handleItemEdit(index, slot)}
                                  >
                                    {isEditing ? 'Cancel' : 'Change'}
                                  </button>
                                </div>
                                
                                {isEditing ? (
                                  <ItemSelector
                                    slot={slot}
                                    itemType="weapon"
                                    currentItem={item}
                                    onSelect={(newItem) => handleItemChange(index, slot, newItem)}
                                  />
                                ) : (
                                  <div className="item-display">
                                    <img 
                                      src={getItemIcon(item)}
                                      alt={item?.name || 'Empty'}
                                      style={{ borderColor: getTierColor(item?.tierType) }}
                                    />
                                    <div className="item-info">
                                      <span 
                                        className="item-name"
                                        style={{ color: getTierColor(item?.tierType) }}
                                      >
                                        {item?.name || 'Empty Slot'}
                                      </span>
                                      {item?.description && (
                                        <span className="item-description">
                                          {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Armor Section */}
                      <div className="build-armor">
                        <h5>Armor</h5>
                        <div className="items-grid">
                          {['helmet', 'arms', 'chest', 'legs', 'classItem'].map(slot => {
                            const item = build[slot]
                            const editKey = `${index}-${slot}`
                            const isEditing = editingSlots[editKey]

                            return (
                              <div key={slot} className="item-slot">
                                <div className="item-header">
                                  <span className="slot-name">{slot}</span>
                                  <button 
                                    className="change-btn"
                                    onClick={() => handleItemEdit(index, slot)}
                                  >
                                    {isEditing ? 'Cancel' : 'Change'}
                                  </button>
                                </div>
                                
                                {isEditing ? (
                                  <ItemSelector
                                    slot={slot}
                                    itemType="armor"
                                    currentItem={item}
                                    onSelect={(newItem) => handleItemChange(index, slot, newItem)}
                                  />
                                ) : (
                                  <div className="item-display">
                                    <img 
                                      src={getItemIcon(item)}
                                      alt={item?.name || 'Empty'}
                                      style={{ borderColor: getTierColor(item?.tierType) }}
                                    />
                                    <div className="item-info">
                                      <span 
                                        className="item-name"
                                        style={{ color: getTierColor(item?.tierType) }}
                                      >
                                        {item?.name || 'Empty Slot'}
                                      </span>
                                      {item?.description && (
                                        <span className="item-description">
                                          {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Subclass Configuration */}
                      <div className="build-subclass">
                        <h5>Subclass Configuration</h5>
                        <div className="subclass-details">
                          <div className="subclass-super">
                            <span className="config-label">Super:</span>
                            <span className="config-value">{build.super}</span>
                          </div>
                          
                          <div className="subclass-abilities">
                            <h6>Abilities</h6>
                            <div className="abilities-list">
                              <div className="ability">
                                <span className="ability-type">Grenade:</span>
                                <span className="ability-name">{build.abilities?.grenade}</span>
                              </div>
                              <div className="ability">
                                <span className="ability-type">Melee:</span>
                                <span className="ability-name">{build.abilities?.melee}</span>
                              </div>
                              <div className="ability">
                                <span className="ability-type">Class:</span>
                                <span className="ability-name">{build.abilities?.classAbility}</span>
                              </div>
                            </div>
                          </div>

                          <div className="subclass-aspects">
                            <h6>Aspects</h6>
                            <div className="aspects-list">
                              {(build.aspects || []).map((aspect, i) => (
                                <div key={i} className="aspect">
                                  <span className="aspect-name">{aspect.name}</span>
                                  <span className="fragment-slots">
                                    ({aspect.fragmentSlots} slots)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="subclass-fragments">
                            <h6>Fragments</h6>
                            <div className="fragments-list">
                              {(build.fragments || []).map((fragment, i) => (
                                <div key={i} className="fragment">
                                  <span className="fragment-name">{fragment.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mods Section */}
                      <div className="build-mods">
                        <h5>Mod Configuration</h5>
                        
                        {/* Armor Mods */}
                        <div className="armor-mods">
                          <h6>Armor Mods</h6>
                          {['helmet', 'arms', 'chest', 'legs', 'classItem'].map(slot => {
                            const mods = build.mods?.[slot] || []
                            if (mods.length === 0) return null
                            
                            return (
                              <div key={slot} className="mod-slot">
                                <span className="mod-slot-name">{slot}:</span>
                                <div className="mods-list">
                                  {mods.map((mod, i) => (
                                    <span key={i} className="mod-chip">
                                      {mod.name} ({mod.energyCost}⚡)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Artifact Mods */}
                        {build.mods?.artifact && build.mods.artifact.length > 0 && (
                          <div className="artifact-mods">
                            <h6>Seasonal Artifact Mods</h6>
                            <div className="artifact-list">
                              {build.mods.artifact.map((mod, i) => (
                                <div 
                                  key={i} 
                                  className={`artifact-mod ${mod.recommended ? 'recommended' : ''}`}
                                >
                                  <span className="mod-name">{mod.name}</span>
                                  <span className="mod-cost">Cost: {mod.unlockCost}</span>
                                  {mod.recommended && (
                                    <span className="recommended-badge">Recommended</span>
                                  )}
                                  <span className="mod-description">{mod.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score Breakdown */}
                      {build.scoreBreakdown && (
                        <div className="score-breakdown">
                          <h5>Score Breakdown</h5>
                          <div className="score-details">
                            {Object.entries(build.scoreBreakdown).map(([category, value]) => (
                              <div key={category} className="score-category">
                                <span className="category-name">
                                  {category.replace('_', ' ')}:
                                </span>
                                <span className="category-score">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          <div className="load-more-section">
            <button 
              className="load-more-btn"
              onClick={onLoadMore}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner small"></div>
                  Generating More Builds...
                </>
              ) : (
                'Generate More Builds'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Item Selector Component
function ItemSelector({ slot, itemType, currentItem, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAvailableItems = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/available-items?slot=${slot}&type=${itemType}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    loadAvailableItems()
  }, [slot, itemType])

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="item-selector">
      <input
        type="text"
        placeholder="Search for item..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="item-search"
      />
      
      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <div className="items-dropdown">
          {filteredItems.length === 0 ? (
            <div className="no-items">No items found</div>
          ) : (
            filteredItems.slice(0, 10).map(item => (
              <div 
                key={item.hash}
                className="item-option"
                onClick={() => onSelect(item)}
              >
                <img 
                  src={`https://www.bungie.net${item.icon}`}
                  alt={item.name}
                  className="item-option-icon"
                />
                <span className="item-option-name">{item.name}</span>
                <span className="item-option-type">{item.tierTypeName}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}