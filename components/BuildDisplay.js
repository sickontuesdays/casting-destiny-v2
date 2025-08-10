import { useState, useContext } from 'react'
import { AppContext } from '../pages/_app'

export default function BuildDisplay({ build, onNewSearch }) {
  const { buildScorer, intelligenceStatus } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({
    synergies: false,
    scoring: false,
    alternatives: false,
    recommendations: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatValue = (statName) => {
    // Updated to handle new stat structure
    if (build.stats?.totalStats) {
      return build.stats.totalStats[statName] || 0
    }
    // Fallback for builds that might still use hash keys
    return build.stats?.[statName] || 0
  }

  const getStatBreakpoints = (statName, value) => {
    // Updated breakpoints for Armor 3.0 system (0-200 range)
    const breakpoints = {
      weapons: [60, 100, 140, 180, 200],
      health: [60, 100, 140, 180, 200],
      class: [60, 100, 140, 180, 200],
      super: [60, 100, 140, 180, 200],
      grenade: [60, 100, 140, 180, 200],
      melee: [60, 100, 140, 180, 200]
    }

    const statBreakpoints = breakpoints[statName] || [60, 100, 140, 180, 200]
    const nextBreakpoint = statBreakpoints.find(bp => bp > value)
    const prevBreakpoint = statBreakpoints.filter(bp => bp <= value).pop()

    return { nextBreakpoint, prevBreakpoint, breakpoints: statBreakpoints }
  }

  const renderStatBar = (statName, value) => {
    const { nextBreakpoint, prevBreakpoint, breakpoints } = getStatBreakpoints(statName, value)
    const maxStat = 200 // Updated for Armor 3.0
    const percentage = Math.min((value / maxStat) * 100, 100)

    // Determine tier based on new system
    const tier = Math.floor(value / 20) // Each 20 points = 1 tier
    const isBreakpointReached = value >= 100 // Secondary effects start at 100

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
            className="stat-fill" 
            style={{ width: `${percentage}%` }}
          />
          {/* Primary breakpoint at 100 */}
          <div 
            className={`stat-breakpoint primary ${value >= 100 ? 'reached' : 'unreached'}`}
            style={{ left: '50%' }}
          />
          {/* Secondary breakpoints */}
          {breakpoints.map(bp => (
            <div 
              key={bp}
              className={`stat-breakpoint ${value >= bp ? 'reached' : 'unreached'}`}
              style={{ left: `${(bp / maxStat) * 100}%` }}
            />
          ))}
        </div>
        <div className="stat-info">
          {nextBreakpoint && (
            <span className="next-breakpoint">
              {nextBreakpoint - value} to next milestone
            </span>
          )}
          {value >= 100 && (
            <span className="secondary-effects">Secondary Effects Active</span>
          )}
        </div>
        {/* Show stat effects */}
        <div className="stat-effects">
          {renderStatEffects(statName, value)}
        </div>
      </div>
    )
  }

  const getStatDisplayName = (statName) => {
    // Updated display names for Armor 3.0
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

  const renderStatEffects = (statName, value) => {
    // Show primary and secondary effects based on stat value
    const effects = []
    
    if (value >= 100) {
      effects.push(
        <span key="primary" className="effect primary">
          Primary Effects: {getStatPrimaryEffect(statName)}
        </span>
      )
    }
    
    if (value > 100) {
      const secondaryValue = value - 100
      effects.push(
        <span key="secondary" className="effect secondary">
          Secondary Effects ({secondaryValue}%): {getStatSecondaryEffect(statName)}
        </span>
      )
    }
    
    return effects
  }

  const getStatPrimaryEffect = (statName) => {
    const effects = {
      weapons: 'Reload Speed, Handling, Weapon Damage',
      health: 'Flinch Resistance, Orb Healing',
      class: 'Cooldown Reduction, Energy Gained',
      super: 'Energy Gained',
      grenade: 'Cooldown Reduction, Energy Gained',
      melee: 'Cooldown Reduction, Energy Gained'
    }
    return effects[statName] || 'Enhanced Effects'
  }

  const getStatSecondaryEffect = (statName) => {
    const effects = {
      weapons: 'Boss Damage, Guardian Damage, Double Ammo Chance',
      health: 'Shield Capacity, Shield Recharge Rate',
      class: 'Overshield',
      super: 'Super Damage',
      grenade: 'Grenade Damage',
      melee: 'Melee Damage'
    }
    return effects[statName] || 'Advanced Effects'
  }

  const renderIntelligenceAnalysis = () => {
    if (!build.analysis?.intelligence) return null

    const { intelligence } = build.analysis

    return (
      <div className="intelligence-analysis">
        <h3>🧠 Intelligence Analysis</h3>
        
        {intelligence.synergies && intelligence.synergies.length > 0 && (
          <div className="analysis-section">
            <h4>
              Build Synergies
              <button 
                className="toggle-btn"
                onClick={() => toggleSection('synergies')}
              >
                {expandedSections.synergies ? '−' : '+'}
              </button>
            </h4>
            {expandedSections.synergies && (
              <div className="synergy-list">
                {intelligence.synergies.map((synergy, index) => (
                  <div key={index} className={`synergy-item strength-${synergy.strength}`}>
                    <div className="synergy-header">
                      <span className="synergy-description">{synergy.description}</span>
                      <span className="synergy-strength">
                        {synergy.strength === 'strong' ? 'Strong' : 
                         synergy.strength === 'moderate' ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    {synergy.items && (
                      <div className="synergy-items">
                        Items: {synergy.items.map(item => item.data?.displayProperties?.name || 'Unknown').join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {intelligence.recommendations && intelligence.recommendations.length > 0 && (
          <div className="analysis-section">
            <h4>
              AI Recommendations
              <button 
                className="toggle-btn"
                onClick={() => toggleSection('recommendations')}
              >
                {expandedSections.recommendations ? '−' : '+'}
              </button>
            </h4>
            {expandedSections.recommendations && (
              <div className="recommendations-list">
                {intelligence.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                    <div className="recommendation-header">
                      <span className="recommendation-type">{rec.type?.replace('_', ' ')}</span>
                      <span className="recommendation-priority">{rec.priority}</span>
                    </div>
                    <div className="recommendation-description">{rec.description}</div>
                    {rec.expectedImprovement && (
                      <div className="recommendation-improvement">
                        Expected: {rec.expectedImprovement}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderEnhancedScoring = () => {
    if (!build.scoring) return null

    const { scoring } = build

    return (
      <div className="enhanced-scoring">
        <h3>📊 Enhanced Scoring</h3>
        
        <div className="total-score">
          <div className="score-display">
            <span className="score-value">{Math.round(scoring.totalScore || 0)}</span>
            <span className="score-label">Overall Score</span>
          </div>
        </div>

        {scoring.breakdown && (
          <div className="score-breakdown">
            <h4>
              Score Breakdown
              <button 
                className="toggle-btn"
                onClick={() => toggleSection('scoring')}
              >
                {expandedSections.scoring ? '−' : '+'}
              </button>
            </h4>
            {expandedSections.scoring && (
              <div className="breakdown-list">
                {Object.entries(scoring.breakdown).map(([category, data]) => (
                  <div key={category} className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-category">{category}</span>
                      <span className="breakdown-score">{Math.round(data.score || 0)}</span>
                    </div>
                    <div className="breakdown-description">{data.description}</div>
                    <div className="breakdown-bar">
                      <div 
                        className="breakdown-fill"
                        style={{ width: `${(data.score || 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scoring.strengths && scoring.strengths.length > 0 && (
          <div className="strengths-section">
            <h4>Strengths</h4>
            <ul className="strengths-list">
              {scoring.strengths.map((strength, index) => (
                <li key={index} className="strength-item">
                  <span className="strength-category">{strength.category}:</span>
                  <span className="strength-description">{strength.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {scoring.weaknesses && scoring.weaknesses.length > 0 && (
          <div className="weaknesses-section">
            <h4>Areas for Improvement</h4>
            <ul className="weaknesses-list">
              {scoring.weaknesses.map((weakness, index) => (
                <li key={index} className="weakness-item">
                  <span className="weakness-category">{weakness.category}:</span>
                  <span className="weakness-description">{weakness.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderAlternatives = () => {
    if (!build.alternatives || build.alternatives.length === 0) return null

    return (
      <div className="alternatives-section">
        <h3>
          Build Alternatives
          <button 
            className="toggle-btn"
            onClick={() => toggleSection('alternatives')}
          >
            {expandedSections.alternatives ? '−' : '+'}
          </button>
        </h3>
        {expandedSections.alternatives && (
          <div className="alternatives-list">
            {build.alternatives.map((alt, index) => (
              <div key={index} className="alternative-item">
                <div className="alternative-header">
                  <span className="alternative-name">{alt.name}</span>
                  <span className="alternative-score">{Math.round(alt.score || 0)}</span>
                </div>
                <div className="alternative-description">{alt.description}</div>
                {alt.changes && (
                  <div className="alternative-differences">
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
        )}
      </div>
    )
  }

  if (!build) {
    return (
      <div className="build-display-empty">
        <p>No build to display</p>
        <button onClick={onNewSearch}>Create New Build</button>
      </div>
    )
  }

  // Updated stat names for Armor 3.0
  const statNames = ['weapons', 'health', 'class', 'super', 'grenade', 'melee']

  return (
    <div className="build-display">
      <div className="build-header">
        <h2>{build.name || 'Generated Build'}</h2>
        <div className="build-actions">
          <button onClick={onNewSearch} className="new-search-btn">
            New Build
          </button>
          <button className="save-build-btn">Save Build</button>
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
                {build.helmet && (
                  <div className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">Helmet</span>
                      <span className="item-tier">
                        {build.helmet.tier || 'Legendary'}
                      </span>
                    </div>
                    <div className="item-name">{build.helmet.name}</div>
                  </div>
                )}
                {build.arms && (
                  <div className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">Arms</span>
                      <span className="item-tier">
                        {build.arms.tier || 'Legendary'}
                      </span>
                    </div>
                    <div className="item-name">{build.arms.name}</div>
                  </div>
                )}
                {build.chest && (
                  <div className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">Chest</span>
                      <span className="item-tier">
                        {build.chest.tier || 'Legendary'}
                      </span>
                    </div>
                    <div className="item-name">{build.chest.name}</div>
                  </div>
                )}
                {build.legs && (
                  <div className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">Legs</span>
                      <span className="item-tier">
                        {build.legs.tier || 'Legendary'}
                      </span>
                    </div>
                    <div className="item-name">{build.legs.name}</div>
                  </div>
                )}
                {build.class && (
                  <div className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">Class Item</span>
                      <span className="item-tier">
                        {build.class.tier || 'Legendary'}
                      </span>
                    </div>
                    <div className="item-name">{build.class.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Weapons Section */}
            {(build.kinetic || build.energy || build.power) && (
              <div className="weapons-section">
                <h3>Weapons</h3>
                <div className="weapons-grid">
                  {build.kinetic && (
                    <div className="weapon-item">
                      <span className="weapon-slot">Kinetic</span>
                      <span className="weapon-name">{build.kinetic.name}</span>
                    </div>
                  )}
                  {build.energy && (
                    <div className="weapon-item">
                      <span className="weapon-slot">Energy</span>
                      <span className="weapon-name">{build.energy.name}</span>
                    </div>
                  )}
                  {build.power && (
                    <div className="weapon-item">
                      <span className="weapon-slot">Power</span>
                      <span className="weapon-name">{build.power.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && renderIntelligenceAnalysis()}
        {activeTab === 'scoring' && renderEnhancedScoring()}
        {activeTab === 'alternatives' && renderAlternatives()}
      </div>
    </div>
  )
}