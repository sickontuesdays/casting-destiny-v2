import { useState, useEffect } from 'react'
import { EnhancedBuildScorer } from '../lib/enhanced-build-scorer'

export default function BuildDisplay({ build, onNewSearch, useInventoryOnly, session }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [enhancedScore, setEnhancedScore] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    synergies: false,
    alternatives: false,
    optimizations: false
  })

  useEffect(() => {
    if (build && build.analysis) {
      // Enhanced scoring is already included in intelligent builds
      setEnhancedScore(build.analysis.scoring)
    } else if (build) {
      // For legacy builds, calculate enhanced scoring
      calculateEnhancedScore()
    }
  }, [build])

  const calculateEnhancedScore = async () => {
    if (!build || isAnalyzing) return

    setIsAnalyzing(true)
    try {
      const scorer = new EnhancedBuildScorer()
      const scoring = await scorer.scoreBuild(build, {
        includeAlternatives: true,
        includeOptimizations: true
      })
      setEnhancedScore(scoring)
    } catch (error) {
      console.error('Error calculating enhanced score:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getScoreColor = (score) => {
    if (score >= 85) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }

  const getStatValue = (statHash) => {
    return build.stats?.[statHash] || 0
  }

  const getStatBreakpoints = (statHash, value) => {
    const breakpoints = {
      2996146975: [30, 50, 70, 100], // Mobility
      392767087: [30, 50, 70, 100],  // Resilience  
      1943323491: [30, 50, 70, 100], // Recovery
      1735777505: [40, 70, 100],     // Discipline
      144602215: [40, 70, 100],      // Intellect
      4244567218: [40, 70, 100]      // Strength
    }

    const statBreakpoints = breakpoints[statHash] || []
    const nextBreakpoint = statBreakpoints.find(bp => bp > value)
    const prevBreakpoint = statBreakpoints.filter(bp => bp <= value).pop()

    return { nextBreakpoint, prevBreakpoint, breakpoints: statBreakpoints }
  }

  const renderStatBar = (statName, statHash, value) => {
    const { nextBreakpoint, prevBreakpoint, breakpoints } = getStatBreakpoints(statHash, value)
    const maxStat = 100
    const percentage = Math.min((value / maxStat) * 100, 100)

    return (
      <div key={statHash} className="stat-bar">
        <div className="stat-header">
          <span className="stat-name">{statName}</span>
          <span className="stat-value">{value}</span>
        </div>
        <div className="stat-progress">
          <div 
            className="stat-fill" 
            style={{ width: `${percentage}%` }}
          />
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
              {nextBreakpoint - value} to next tier
            </span>
          )}
          {prevBreakpoint && (
            <span className="tier-info">Tier {Math.floor(prevBreakpoint / 10)}</span>
          )}
        </div>
      </div>
    )
  }

  const renderIntelligenceAnalysis = () => {
    if (!build.analysis?.intelligence) return null

    const { intelligence } = build.analysis

    return (
      <div className="intelligence-analysis">
        <h3>🧠 Intelligence Analysis</h3>
        
        {intelligence.triggers && intelligence.triggers.length > 0 && (
          <div className="analysis-section">
            <h4>Detected Triggers</h4>
            <div className="trigger-list">
              {intelligence.triggers.map((trigger, index) => (
                <div key={index} className="trigger-item">
                  <div className="trigger-header">
                    <span className="trigger-type">{trigger.type}</span>
                    <span className="trigger-priority">{trigger.priority}</span>
                  </div>
                  <div className="trigger-condition">{trigger.condition}</div>
                  {trigger.effect && (
                    <div className="trigger-effect">{trigger.effect}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <span className="synergy-items">
                        {synergy.items.map(item => item.name).join(' + ')}
                      </span>
                      <span className="synergy-strength">
                        {synergy.strength >= 0.8 ? 'Strong' : 
                         synergy.strength >= 0.5 ? 'Good' : 'Weak'}
                      </span>
                    </div>
                    <div className="synergy-description">{synergy.description}</div>
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
    if (!enhancedScore) {
      return (
        <div className="scoring-loading">
          {isAnalyzing ? 'Analyzing build...' : 'No scoring data available'}
        </div>
      )
    }

    return (
      <div className="enhanced-scoring">
        <div className="overall-score">
          <div className={`score-circle ${getScoreColor(enhancedScore.totalScore)}`}>
            <span className="score-value">{Math.round(enhancedScore.totalScore)}</span>
            <span className="score-label">Overall</span>
          </div>
        </div>

        <div className="score-breakdown">
          {Object.entries(enhancedScore.breakdown || {}).map(([category, score]) => (
            <div key={category} className="score-category">
              <div className="category-header">
                <span className="category-name">{category}</span>
                <span className="category-score">{Math.round(score)}</span>
              </div>
              <div className="category-bar">
                <div 
                  className={`category-fill ${getScoreColor(score)}`}
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {enhancedScore.recommendations && enhancedScore.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>
              Optimization Suggestions
              <button 
                className="toggle-btn"
                onClick={() => toggleSection('optimizations')}
              >
                {expandedSections.optimizations ? '−' : '+'}
              </button>
            </h4>
            {expandedSections.optimizations && (
              <div className="recommendation-list">
                {enhancedScore.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                    <div className="recommendation-header">
                      <span className="recommendation-type">{rec.type}</span>
                      <span className="recommendation-impact">+{rec.expectedImprovement}</span>
                    </div>
                    <div className="recommendation-description">{rec.description}</div>
                    {rec.alternatives && (
                      <div className="recommendation-alternatives">
                        <strong>Try:</strong> {rec.alternatives.join(', ')}
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

  const renderBuildAlternatives = () => {
    if (!build.alternatives || build.alternatives.length === 0) return null

    return (
      <div className="build-alternatives">
        <h3>
          Alternative Builds
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
                  <span className="alternative-score">{Math.round(alt.score)}</span>
                </div>
                <div className="alternative-description">{alt.description}</div>
                <div className="alternative-differences">
                  <strong>Key Changes:</strong>
                  <ul>
                    {alt.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
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

  const statNames = {
    2996146975: 'Mobility',
    392767087: 'Resilience',
    1943323491: 'Recovery',
    1735777505: 'Discipline',
    144602215: 'Intellect',
    4244567218: 'Strength'
  }

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
              <h3>Stats</h3>
              <div className="stats-grid">
                {Object.entries(statNames).map(([statHash, statName]) => 
                  renderStatBar(statName, statHash, getStatValue(statHash))
                )}
              </div>
              <div className="total-stats">
                Total: {Object.values(build.stats || {}).reduce((sum, val) => sum + val, 0)}
              </div>
            </div>

            {/* Equipment Section */}
            <div className="equipment-section">
              <h3>Equipment</h3>
              <div className="equipment-grid">
                {build.armor && Object.entries(build.armor).map(([slot, item]) => (
                  <div key={slot} className="equipment-item">
                    <div className="item-header">
                      <span className="item-slot">{slot}</span>
                      <span className={`item-tier ${item.tier?.toLowerCase()}`}>
                        {item.tier}
                      </span>
                    </div>
                    <div className="item-name">{item.name}</div>
                    {item.description && (
                      <div className="item-description">{item.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Analysis */}
            {build.analysis?.request && (
              <div className="quick-analysis">
                <h3>Build Summary</h3>
                <div className="analysis-summary">
                  <div className="request-interpretation">
                    <strong>Request:</strong> {build.analysis.request.interpretation}
                  </div>
                  {build.analysis.request.activityType && (
                    <div className="activity-focus">
                      <strong>Activity Focus:</strong> {build.analysis.request.activityType}
                    </div>
                  )}
                  {build.analysis.request.statPriorities && (
                    <div className="stat-priorities">
                      <strong>Stat Priorities:</strong> {build.analysis.request.statPriorities.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            {renderIntelligenceAnalysis()}
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="scoring-tab">
            {renderEnhancedScoring()}
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="alternatives-tab">
            {renderBuildAlternatives()}
          </div>
        )}
      </div>

      {build.metadata && (
        <div className="build-metadata">
          <div className="metadata-item">
            <span>Generated:</span>
            <span>{new Date(build.metadata.generatedAt).toLocaleString()}</span>
          </div>
          {build.metadata.processingTime && (
            <div className="metadata-item">
              <span>Processing Time:</span>
              <span>{build.metadata.processingTime}ms</span>
            </div>
          )}
          {build.metadata.intelligenceVersion && (
            <div className="metadata-item">
              <span>Intelligence Version:</span>
              <span>{build.metadata.intelligenceVersion}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}