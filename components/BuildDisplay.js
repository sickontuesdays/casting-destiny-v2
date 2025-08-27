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
                <div key={index} className={`build-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  {/* Build Header - Always Visible */}
                  <div 
                    className="build-header"
                    onClick={() => toggleBuildExpansion(index)}
                  >
                    <div className="build-title">
                      <h4>Build {index + 1}</h4>
                      {build.name && <span className="build-name">{build.name}</span>}
                      {build.subclass && (
                        <div className="subclass-indicator">
                          <img 
                            src={getSubclassIcon(build.subclass)} 
                            alt={build.subclass}
                            width={20}
                            height={20}
                          />
                          <span>{build.subclass}</span>
                        </div>
                      )}
                    </div>

                    <div className="build-metrics">
                      <div className="confidence-score">
                        <span className="label">Confidence:</span>
                        <span className={`value ${confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'}`}>
                          {confidence}%
                        </span>
                      </div>
                      <div className="build-score">
                        <span className="label">Score:</span>
                        <span className="value">{score}</span>
                      </div>
                    </div>

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
                                      width: `${Math.min(value, 100)}%`,
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
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleItemEdit(index, slot)
                                    }}
                                  >
                                    {isEditing ? 'Cancel' : 'Change'}
                                  </button>
                                </div>
                                
                                {isEditing ? (
                                  <div className="item-selector">
                                    <p className="selector-note">
                                      Item selection requires inventory access
                                    </p>
                                  </div>
                                ) : (
                                  <div className="item-display">
                                    <div className="item-icon-container">
                                      <img
                                        src={getItemIcon(item)}
                                        alt={item?.name || 'Empty slot'}
                                        width={50}
                                        height={50}
                                        className="item-icon"
                                        style={{
                                          border: `2px solid ${getTierColor(item?.tier)}`
                                        }}
                                      />
                                    </div>
                                    <div className="item-details">
                                      <span className="item-name">
                                        {item?.name || 'No item selected'}
                                      </span>
                                      {item?.type && (
                                        <span className="item-type">{item.type}</span>
                                      )}
                                      {item?.perks && (
                                        <div className="item-perks">
                                          {item.perks.slice(0, 2).map((perk, i) => (
                                            <span key={i} className="perk-name">
                                              {perk.name}
                                            </span>
                                          ))}
                                        </div>
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
                          {['helmet', 'gauntlets', 'chest', 'legs', 'classItem'].map(slot => {
                            const item = build[slot]
                            const editKey = `${index}-${slot}`
                            const isEditing = editingSlots[editKey]

                            return (
                              <div key={slot} className="item-slot">
                                <div className="item-header">
                                  <span className="slot-name">{slot.replace(/([A-Z])/g, ' $1')}</span>
                                  <button 
                                    className="change-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleItemEdit(index, slot)
                                    }}
                                  >
                                    {isEditing ? 'Cancel' : 'Change'}
                                  </button>
                                </div>
                                
                                {isEditing ? (
                                  <div className="item-selector">
                                    <p className="selector-note">
                                      Item selection requires inventory access
                                    </p>
                                  </div>
                                ) : (
                                  <div className="item-display">
                                    <div className="item-icon-container">
                                      <img
                                        src={getItemIcon(item)}
                                        alt={item?.name || 'Empty slot'}
                                        width={50}
                                        height={50}
                                        className="item-icon"
                                        style={{
                                          border: `2px solid ${getTierColor(item?.tier)}`
                                        }}
                                      />
                                    </div>
                                    <div className="item-details">
                                      <span className="item-name">
                                        {item?.name || 'No armor selected'}
                                      </span>
                                      {item?.stats && (
                                        <div className="armor-stats">
                                          {Object.entries(item.stats).slice(0, 3).map(([stat, value]) => (
                                            <span key={stat} className="stat-mini">
                                              {stat}: {value}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Mods Section */}
                      <div className="build-mods">
                        <h5>Recommended Mods</h5>
                        {build.mods && build.mods.length > 0 ? (
                          <div className="mods-grid">
                            {build.mods.map((mod, modIndex) => (
                              <div 
                                key={modIndex} 
                                className={`mod-item ${mod.recommended ? 'recommended' : ''}`}
                              >
                                <span className="mod-name">{mod.name}</span>
                                {mod.unlockCost && (
                                  <span className="mod-cost">Cost: {mod.unlockCost}</span>
                                )}
                                {mod.recommended && (
                                  <span className="recommended-badge">Recommended</span>
                                )}
                                {mod.description && (
                                  <span className="mod-description">{mod.description}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-mods">No specific mod recommendations</p>
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
                                  {category.replace(/_/g, ' ')}:
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
              {isGenerating ? 'Generating...' : 'Generate More Builds'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}