import { useState, useContext } from 'react'
import { AppContext } from '../pages/_app'

export default function BuildDisplay({ build, onNewSearch }) {
  const { buildScorer, intelligenceStatus, isIntelligenceReady } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({
    synergies: false,
    scoring: false,
    alternatives: false,
    recommendations: false
  })
  const [isSaving, setIsSaving] = useState(false)

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatValue = (statName) => {
    // Handle new Armor 3.0 stat structure
    if (build.stats?.totalStats) {
      return build.stats.totalStats[statName] || 0
    }
    // Fallback for different stat structures
    return build.stats?.[statName] || 0
  }

  const getStatDisplayName = (statName) => {
    const displayNames = {
      weapons: 'Weapons',
      health: 'Health', 
      class: 'Class',
      super: 'Super',
      grenade: 'Grenade',
      melee: 'Melee'
    }
    return displayNames[statName] || statName
  }

  const getStatBreakpoints = (statName, value) => {
    // Updated breakpoints for new Armor 3.0 system (0-200 range)
    const breakpoints = [60, 100, 140, 180, 200]
    const nextBreakpoint = breakpoints.find(bp => bp > value)
    const prevBreakpoint = breakpoints.filter(bp => bp <= value).pop()
    
    return { nextBreakpoint, prevBreakpoint, breakpoints }
  }

  const renderStatBar = (statName, value) => {
    const { nextBreakpoint, prevBreakpoint, breakpoints } = getStatBreakpoints(statName, value)
    const maxStat = 200
    const percentage = Math.min((value / maxStat) * 100, 100)
    const tier = Math.floor(value / 20)
    const isBreakpointReached = value >= 100

    return (
      <div key={statName} className="stat-bar">
        <div className="stat-header">
          <span className="stat-name">{getStatDisplayName(statName)}</span>
          <span className="stat-value">{value}</span>
          <span className={`stat-tier tier-${tier}`}>T{tier}</span>
          {isBreakpointReached && <span className="breakpoint-indicator">⚡</span>}
        </div>
        <div className="stat-progress">
          <div 
            className={`stat-fill ${tier >= 5 ? 'high-tier' : ''}`}
            style={{ width: `${percentage}%` }}
          />
          {/* Primary breakpoint marker at 100 */}
          <div 
            className={`stat-breakpoint primary ${value >= 100 ? 'reached' : 'unreached'}`}
            style={{ left: '50%' }}
          />
          {/* Additional breakpoint markers */}
          {breakpoints.map(bp => (
            <div 
              key={bp}
              className={`stat-breakpoint ${value >= bp ? 'reached' : 'unreached'}`}
              style={{ left: `${(bp / maxStat) * 100}%` }}
            />
          ))}
        </div>
        <div className="stat-details">
          {nextBreakpoint && (
            <span className="next-breakpoint">
              +{nextBreakpoint - value} to next tier
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderEquipmentItem = (item, slot) => {
    if (!item) return null

    return (
      <div className="equipment-item">
        <div className="item-header">
          <span className="item-slot">{slot}</span>
          <span className={`item-tier ${item.tier?.toLowerCase() || 'legendary'}`}>
            {item.tier || 'Legendary'}
          </span>
        </div>
        <div className="item-content">
          <div className="item-icon">
            {item.icon ? (
              <img src={item.icon} alt={item.name} />
            ) : (
              <div className="placeholder-icon">{slot.charAt(0)}</div>
            )}
          </div>
          <div className="item-details">
            <div className="item-name">{item.name || `${slot} Item`}</div>
            {item.description && (
              <div className="item-description">{item.description}</div>
            )}
            {item.powerLevel && (
              <div className="item-power">Power: {item.powerLevel}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleSaveBuild = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          build,
          name: build.name || 'Generated Build',
          description: build.description || 'AI-generated build'
        })
      })

      if (response.ok) {
        console.log('Build saved successfully')
        // Could show a success message here
      } else {
        console.error('Failed to save build')
      }
    } catch (error) {
      console.error('Error saving build:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSynergiesSection = () => {
    if (!build.synergies || build.synergies.length === 0) {
      return <p>No synergies detected.</p>
    }

    return (
      <div className="synergies-list">
        {build.synergies.map((synergy, index) => (
          <div key={index} className={`synergy-item ${synergy.strength}`}>
            <div className="synergy-header">
              <span className="synergy-name">{synergy.name}</span>
              <span className={`synergy-strength ${synergy.strength}`}>
                {synergy.strength}
              </span>
            </div>
            <div className="synergy-description">{synergy.description}</div>
            {synergy.items && (
              <div className="synergy-items">
                <strong>Involves:</strong> {synergy.items.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderAlternativesSection = () => {
    if (!build.alternatives || build.alternatives.length === 0) {
      return <p>No alternatives available.</p>
    }

    return (
      <div className="alternatives-list">
        {build.alternatives.map((alt, index) => (
          <div key={index} className="alternative-item">
            <div className="alternative-header">
              <span className="alternative-name">{alt.name}</span>
              <span className="alternative-score">{Math.round(alt.score || 0)}</span>
            </div>
            <div className="alternative-description">{alt.description}</div>
            {alt.changes && (
              <div className="alternative-changes">
                <strong>Key Changes:</strong>
                <ul>
                  {alt.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (!build) {
    return (
      <div className="build-display-empty">
        <p>No build to display</p>
        <button onClick={onNewSearch} className="new-search-btn">
          Create New Build
        </button>
      </div>
    )
  }

  const statNames = ['weapons', 'health', 'class', 'super', 'grenade', 'melee']

  return (
    <div className="build-display">
      <div className="build-header">
        <div className="build-title">
          <h2>{build.name || 'Generated Build'}</h2>
          {build.metadata?.confidence && (
            <span className="confidence-badge">
              {Math.round(build.metadata.confidence * 100)}% Match
            </span>
          )}
        </div>
        
        <div className="build-actions">
          <button onClick={onNewSearch} className="new-search-btn">
            New Build
          </button>
          <button 
            onClick={handleSaveBuild} 
            className="save-build-btn"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Build'}
          </button>
          <button className="share-build-btn">Share</button>
        </div>
      </div>

      <div className="build-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Intelligence Analysis
        </button>
        <button 
          className={`tab ${activeTab === 'scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >
          Enhanced Scoring
        </button>
        <button 
          className={`tab ${activeTab === 'alternatives' ? 'active' : ''}`}
          onClick={() => setActiveTab('alternatives')}
        >
          Alternatives
        </button>
      </div>

      <div className="build-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Stats Section */}
            <div className="stats-section">
              <h3>Armor 3.0 Stats</h3>
              <div className="stats-grid">
                {statNames.map(statName => 
                  renderStatBar(statName, getStatValue(statName))
                )}
              </div>
              <div className="total-stats">
                Total: {statNames.reduce((sum, statName) => sum + getStatValue(statName), 0)}/1200
              </div>
              <div className="stats-info">
                <span className="breakpoint-info">⚡ = Secondary Effects Active (100+)</span>
              </div>
            </div>

            {/* Equipment Section */}
            <div className="equipment-section">
              <h3>Equipment</h3>
              <div className="equipment-grid">
                {renderEquipmentItem(build.helmet, 'Helmet')}
                {renderEquipmentItem(build.arms, 'Arms')}
                {renderEquipmentItem(build.chest, 'Chest')}
                {renderEquipmentItem(build.legs, 'Legs')}
                {renderEquipmentItem(build.class, 'Class Item')}
              </div>
            </div>

            {/* Weapons Section */}
            <div className="weapons-section">
              <h3>Weapons</h3>
              <div className="weapons-grid">
                {renderEquipmentItem(build.kinetic, 'Kinetic')}
                {renderEquipmentItem(build.energy, 'Energy')}
                {renderEquipmentItem(build.power, 'Power')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            {/* Synergies */}
            <div className="analysis-section">
              <h3 
                onClick={() => toggleSection('synergies')}
                className="collapsible-header"
              >
                Synergies Detected ({build.synergies?.length || 0})
                <button className="expand-btn">
                  {expandedSections.synergies ? '−' : '+'}
                </button>
              </h3>
              {expandedSections.synergies && renderSynergiesSection()}
            </div>

            {/* Build Strengths and Weaknesses */}
            {build.analysis && (
              <div className="analysis-section">
                <h3>Build Analysis</h3>
                {build.analysis.strengths && (
                  <div className="strengths">
                    <h4>Strengths:</h4>
                    <ul>
                      {build.analysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {build.analysis.weaknesses && (
                  <div className="weaknesses">
                    <h4>Areas for Improvement:</h4>
                    <ul>
                      {build.analysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="scoring-tab">
            <div className="scoring-section">
              <h3>Enhanced Performance Scoring</h3>
              {isIntelligenceReady() ? (
                <div className="score-breakdown">
                  <div className="overall-score">
                    <span>Overall Score: {Math.round(build.score || 85)}/100</span>
                  </div>
                  <div className="score-categories">
                    <div className="score-item">
                      <span>Stat Optimization:</span>
                      <span>{Math.round(build.scoring?.statOptimization || 90)}/100</span>
                    </div>
                    <div className="score-item">
                      <span>Synergy Strength:</span>
                      <span>{Math.round(build.scoring?.synergyStrength || 85)}/100</span>
                    </div>
                    <div className="score-item">
                      <span>Activity Suitability:</span>
                      <span>{Math.round(build.scoring?.activitySuitability || 80)}/100</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Enhanced scoring requires AI Intelligence system.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="alternatives-tab">
            <div className="alternatives-section">
              <h3>Alternative Builds</h3>
              {renderAlternativesSection()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}