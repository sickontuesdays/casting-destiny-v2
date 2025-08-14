import { useState, useContext } from 'react'
import { AppContext } from '../pages/_app'

export default function BuildCreator({ onBuildGenerated, useInventoryOnly = false, lockedExotic = null }) {
  const { buildIntelligence, manifest, isIntelligenceReady } = useContext(AppContext)
  const [selectedClass, setSelectedClass] = useState('any')
  const [selectedActivity, setSelectedActivity] = useState('general_pve')
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('balanced')
  const [focusStats, setFocusStats] = useState([])
  const [selectedElement, setSelectedElement] = useState('any')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const classes = [
    { value: 'any', label: 'Any Class' },
    { value: 'titan', label: 'Titan' },
    { value: 'hunter', label: 'Hunter' },
    { value: 'warlock', label: 'Warlock' }
  ]

  const activities = [
    { value: 'general_pve', label: 'General PvE' },
    { value: 'raid', label: 'Raid' },
    { value: 'pvp', label: 'PvP/Crucible' },
    { value: 'dungeon', label: 'Dungeon' },
    { value: 'nightfall', label: 'Nightfall' },
    { value: 'gambit', label: 'Gambit' },
    { value: 'trials', label: 'Trials of Osiris' },
    { value: 'strikes', label: 'Strikes' }
  ]

  const playstyles = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'aggressive', label: 'Aggressive' },
    { value: 'defensive', label: 'Defensive' },
    { value: 'support', label: 'Support' },
    { value: 'dps', label: 'DPS/Damage' },
    { value: 'speed', label: 'Speed/Mobility' }
  ]

  const stats = [
    { value: 'weapons', label: 'Weapons' },
    { value: 'health', label: 'Health' },
    { value: 'class', label: 'Class Ability' },
    { value: 'super', label: 'Super' },
    { value: 'grenade', label: 'Grenade' },
    { value: 'melee', label: 'Melee' }
  ]

  const elements = [
    { value: 'any', label: 'Any Element' },
    { value: 'solar', label: 'Solar' },
    { value: 'arc', label: 'Arc' },
    { value: 'void', label: 'Void' },
    { value: 'stasis', label: 'Stasis' },
    { value: 'strand', label: 'Strand' }
  ]

  const handleStatToggle = (statValue) => {
    setFocusStats(prev => 
      prev.includes(statValue) 
        ? prev.filter(s => s !== statValue)
        : [...prev, statValue]
    )
  }

  const generateBuildRequest = () => {
    const parts = []
    
    if (selectedClass !== 'any') {
      parts.push(selectedClass)
    }
    
    if (selectedActivity !== 'general_pve') {
      parts.push(`for ${selectedActivity}`)
    }
    
    if (focusStats.length > 0) {
      parts.push(`with high ${focusStats.join(' and ')}`)
    }
    
    if (selectedPlaystyle !== 'balanced') {
      parts.push(`${selectedPlaystyle} playstyle`)
    }
    
    if (selectedElement !== 'any') {
      parts.push(`${selectedElement} build`)
    }
    
    if (lockedExotic) {
      parts.push(`using ${lockedExotic.name}`)
    }
    
    return parts.join(' ') || 'balanced build for general content'
  }

  const handleGenerate = async () => {
    if (!isIntelligenceReady()) {
      setError('AI Intelligence system is not ready. Please wait a moment and try again.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const buildRequest = generateBuildRequest()
      console.log('🏗️ Generating build with request:', buildRequest)
      
      const buildOptions = {
        useInventoryOnly,
        lockedExotic,
        includeAlternatives: true,
        detailedAnalysis: true,
        optimizationSuggestions: true
      }

      const result = await buildIntelligence.generateBuild(buildRequest, buildOptions)
      
      if (result.error) {
        throw new Error(result.error)
      }

      console.log('✅ Build generated successfully:', result)
      onBuildGenerated(result)
      
    } catch (error) {
      console.error('❌ Build generation failed:', error)
      setError(error.message || 'Failed to generate build. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuickPreset = (preset) => {
    switch (preset) {
      case 'pvp_hunter':
        setSelectedClass('hunter')
        setSelectedActivity('pvp')
        setSelectedPlaystyle('aggressive')
        setFocusStats(['weapons', 'class'])
        break
      case 'raid_titan':
        setSelectedClass('titan')
        setSelectedActivity('raid')
        setSelectedPlaystyle('defensive')
        setFocusStats(['health', 'super'])
        break
      case 'warlock_ability':
        setSelectedClass('warlock')
        setSelectedActivity('general_pve')
        setSelectedPlaystyle('support')
        setFocusStats(['grenade', 'super'])
        break
      default:
        break
    }
  }

  const resetForm = () => {
    setSelectedClass('any')
    setSelectedActivity('general_pve')
    setSelectedPlaystyle('balanced')
    setFocusStats([])
    setSelectedElement('any')
    setError(null)
  }

  return (
    <div className="build-creator">
      <div className="creator-header">
        <h3>Advanced Build Creator</h3>
        <p>Configure your build parameters manually</p>
      </div>

      {/* Quick Presets */}
      <div className="quick-presets">
        <h4>Quick Presets</h4>
        <div className="preset-buttons">
          <button 
            onClick={() => handleQuickPreset('pvp_hunter')}
            className="preset-btn"
          >
            PvP Hunter
          </button>
          <button 
            onClick={() => handleQuickPreset('raid_titan')}
            className="preset-btn"
          >
            Raid Titan
          </button>
          <button 
            onClick={() => handleQuickPreset('warlock_ability')}
            className="preset-btn"
          >
            Ability Warlock
          </button>
        </div>
      </div>

      <div className="creator-form">
        {/* Class Selection */}
        <div className="form-group">
          <label>Guardian Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-select"
          >
            {classes.map(cls => (
              <option key={cls.value} value={cls.value}>
                {cls.label}
              </option>
            ))}
          </select>
        </div>

        {/* Activity Selection */}
        <div className="form-group">
          <label>Primary Activity</label>
          <select 
            value={selectedActivity} 
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="form-select"
          >
            {activities.map(activity => (
              <option key={activity.value} value={activity.value}>
                {activity.label}
              </option>
            ))}
          </select>
        </div>

        {/* Playstyle Selection */}
        <div className="form-group">
          <label>Playstyle</label>
          <select 
            value={selectedPlaystyle} 
            onChange={(e) => setSelectedPlaystyle(e.target.value)}
            className="form-select"
          >
            {playstyles.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stat Focus */}
        <div className="form-group">
          <label>Focus Stats (Select multiple)</label>
          <div className="stat-checkboxes">
            {stats.map(stat => (
              <label key={stat.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={focusStats.includes(stat.value)}
                  onChange={() => handleStatToggle(stat.value)}
                />
                <span>{stat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Element Selection */}
        <div className="form-group">
          <label>Subclass Element</label>
          <select 
            value={selectedElement} 
            onChange={(e) => setSelectedElement(e.target.value)}
            className="form-select"
          >
            {elements.map(element => (
              <option key={element.value} value={element.value}>
                {element.label}
              </option>
            ))}
          </select>
        </div>

        {/* Locked Exotic Display */}
        {lockedExotic && (
          <div className="form-group">
            <label>Locked Exotic</label>
            <div className="locked-exotic-display">
              <span className="exotic-name">🔒 {lockedExotic.name}</span>
              <span className="exotic-description">{lockedExotic.description}</span>
            </div>
          </div>
        )}

        {/* Build Preview */}
        <div className="form-group">
          <label>Build Description Preview</label>
          <div className="build-preview">
            <p>"{generateBuildRequest()}"</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <button 
            onClick={resetForm}
            className="reset-btn"
            disabled={isGenerating}
          >
            Reset
          </button>
          
          <button 
            onClick={handleGenerate}
            className="generate-btn primary"
            disabled={isGenerating || !isIntelligenceReady()}
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner small"></div>
                Generating...
              </>
            ) : (
              'Generate Build'
            )}
          </button>
        </div>

        {/* System Status */}
        <div className="system-status">
          {!isIntelligenceReady() && (
            <div className="status-warning">
              <span>⚠️ AI Intelligence system is loading...</span>
            </div>
          )}
          
          {useInventoryOnly && (
            <div className="status-info">
              <span>ℹ️ Using only items from your inventory</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}