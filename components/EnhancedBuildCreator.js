// components/EnhancedBuildCreator.js
// Fixed to use local buildIntelligence instead of API calls

import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from '../pages/_app'
import BuildDisplay from './BuildDisplay'
import NaturalLanguageInput from './NaturalLanguageInput'

export default function EnhancedBuildCreator() {
  const { session } = useAuth()
  const { buildIntelligence, isIntelligenceReady, manifestLoading } = useContext(AppContext)
  
  // Build generation state
  const [builds, setBuilds] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  
  // Build options state
  const [useInventoryOnly, setUseInventoryOnly] = useState(true)
  const [selectedClass, setSelectedClass] = useState('any')
  const [selectedActivity, setSelectedActivity] = useState('general_pve')
  const [selectedSubclass, setSelectedSubclass] = useState(null)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [currentRequest, setCurrentRequest] = useState('')
  
  // UI state
  const [activeTab, setActiveTab] = useState('natural')
  const [showExoticSelector, setShowExoticSelector] = useState(false)
  const [availableExotics, setAvailableExotics] = useState([])

  const activities = [
    { value: 'general_pve', label: 'General PvE' },
    { value: 'raid', label: 'Raid' },
    { value: 'dungeon', label: 'Dungeon' },
    { value: 'pvp', label: 'PvP (Crucible)' },
    { value: 'gambit', label: 'Gambit' },
    { value: 'nightfall', label: 'Nightfall' },
    { value: 'trials', label: 'Trials of Osiris' }
  ]

  const subclasses = [
    { value: null, label: 'Auto-Select Best' },
    { value: 'arc', label: 'Arc', icon: '⚡' },
    { value: 'solar', label: 'Solar', icon: '☀️' },
    { value: 'void', label: 'Void', icon: '🟣' },
    { value: 'stasis', label: 'Stasis', icon: '❄️' },
    { value: 'strand', label: 'Strand', icon: '🕸️' },
    { value: 'prismatic', label: 'Prismatic', icon: '🌈' }
  ]

  // Load available exotics (only when needed)
  useEffect(() => {
    if (session?.user && showExoticSelector) {
      loadAvailableExotics()
    }
  }, [session, useInventoryOnly, showExoticSelector])

  const loadAvailableExotics = async () => {
    try {
      const params = new URLSearchParams({
        useInventoryOnly: useInventoryOnly.toString()
      })
      
      const response = await fetch(`/api/inventory/exotics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableExotics(data.exotics || [])
      }
    } catch (error) {
      console.error('Failed to load exotics:', error)
    }
  }

  const handleNaturalLanguageSubmit = async (request) => {
    setCurrentRequest(request)
    await generateBuildsLocally(request)
  }

  const handleAdvancedGenerate = async () => {
    const parts = []
    
    if (selectedClass !== 'any') {
      parts.push(selectedClass)
    }
    
    parts.push(`${selectedActivity.replace('_', ' ')} build`)
    
    if (selectedSubclass) {
      parts.push(`using ${selectedSubclass}`)
    }
    
    if (lockedExotic) {
      parts.push(`with ${lockedExotic.name}`)
    }
    
    const request = parts.join(' ') || 'optimized build'
    setCurrentRequest(request)
    await generateBuildsLocally(request)
  }

  // FIXED: Use local buildIntelligence instead of API calls
  const generateBuildsLocally = async (request) => {
    if (!session?.user) {
      setError('Please sign in to generate builds')
      return
    }

    // Check if intelligence system is ready
    if (!isIntelligenceReady()) {
      setError('Build Intelligence system is still loading. Please wait...')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🏗️ Generating builds locally using Build Intelligence...')
      
      // Parse the request using local build intelligence
      const parsedRequest = buildIntelligence.parseUserInputLocally(request)
      
      // Add additional context from UI selections
      if (selectedClass !== 'any') parsedRequest.class = selectedClass
      if (selectedActivity !== 'general_pve') parsedRequest.activity = selectedActivity
      if (selectedSubclass) parsedRequest.element = selectedSubclass
      if (lockedExotic) parsedRequest.exotic = lockedExotic.name

      // Generate build using local intelligence (NO API CALLS!)
      const buildResult = await buildIntelligence.createBuildLocally(parsedRequest, {
        useInventoryOnly,
        lockedExotic,
        includeAlternatives: true,
        detailedAnalysis: true
      })

      if (buildResult) {
        // Convert single build to array format
        const buildArray = [buildResult]
        
        // Generate alternatives locally
        const alternatives = await generateAlternativesLocally(parsedRequest, 3)
        buildArray.push(...alternatives)
        
        setBuilds(buildArray)
        console.log(`✅ Generated ${buildArray.length} builds locally`)
      } else {
        throw new Error('Build generation returned no results')
      }
      
    } catch (error) {
      console.error('❌ Local build generation error:', error)
      setError(error.message || 'Failed to generate builds locally')
      setBuilds([])
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAlternativesLocally = async (parsedRequest, count = 3) => {
    const alternatives = []
    
    try {
      for (let i = 0; i < count; i++) {
        // Create variations by adjusting the request
        const altRequest = { ...parsedRequest }
        
        // Vary the playstyle for alternatives
        const playstyles = ['balanced', 'tank', 'dps', 'speed']
        altRequest.playstyle = playstyles[(i + 1) % playstyles.length]
        
        // Vary focus stats slightly
        if (Array.isArray(parsedRequest.focusStats) && parsedRequest.focusStats.length > 0) {
          altRequest.focusStats = [...parsedRequest.focusStats].reverse()
        }
        
        const altBuild = await buildIntelligence.createBuildLocally(altRequest, {
          useInventoryOnly,
          variant: i + 1
        })
        
        if (altBuild) {
          // Mark as alternative
          altBuild.metadata.isAlternative = true
          altBuild.metadata.variant = i + 1
          alternatives.push(altBuild)
        }
      }
    } catch (error) {
      console.error('Error generating alternatives:', error)
    }
    
    return alternatives
  }

  const handleItemChange = async (buildIndex, slot, newItem) => {
    setBuilds(prev => {
      const updated = [...prev]
      updated[buildIndex] = {
        ...updated[buildIndex],
        loadout: {
          ...updated[buildIndex].loadout,
          [slot]: newItem
        },
        metadata: {
          ...updated[buildIndex].metadata,
          modified: true,
          modifiedAt: new Date().toISOString()
        }
      }
      
      // Recalculate build stats locally when items change
      if (buildIntelligence && buildIntelligence.calculateExpectedStatsLocally) {
        updated[buildIndex].stats = buildIntelligence.calculateExpectedStatsLocally(updated[buildIndex].metadata)
        updated[buildIndex].score = buildIntelligence.calculateBuildScoreLocally(updated[buildIndex], updated[buildIndex].metadata)
      }
      
      return updated
    })
  }

  const handleExoticLock = (exotic) => {
    setLockedExotic(exotic)
    setShowExoticSelector(false)
  }

  const clearLockedExotic = () => {
    setLockedExotic(null)
  }

  const handleSaveBuild = async (build) => {
    try {
      const response = await fetch('/api/builds/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ build })
      })

      if (response.ok) {
        alert('Build saved successfully!')
      } else {
        throw new Error('Failed to save build')
      }
    } catch (error) {
      console.error('Failed to save build:', error)
      alert('Failed to save build. Please try again.')
    }
  }

  // Show loading state while intelligence initializes
  if (manifestLoading || !isIntelligenceReady()) {
    return (
      <div className="enhanced-build-creator loading">
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Initializing Build Intelligence System...</p>
          <small>Loading manifest and AI components...</small>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-build-creator">
      <div className="creator-header">
        <h2>Build Intelligence System</h2>
        <p>Create perfect Destiny 2 builds using AI-powered optimization</p>
        <div className="system-status">
          <span className="status-indicator ready"></span>
          <span>Intelligence System Ready</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="creator-tabs">
        <button 
          className={`tab ${activeTab === 'natural' ? 'active' : ''}`}
          onClick={() => setActiveTab('natural')}
        >
          Natural Language
        </button>
        <button 
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced Options
        </button>
      </div>

      {/* Options Bar */}
      <div className="creator-options">
        <div className="option-group">
          <label className="option-toggle">
            <input
              type="checkbox"
              checked={useInventoryOnly}
              onChange={(e) => setUseInventoryOnly(e.target.checked)}
            />
            <span>Use only my inventory</span>
          </label>
          <span className="option-hint">
            {useInventoryOnly ? 
              'Only items in your vault/inventory will be used' : 
              'All available items will be considered'
            }
          </span>
        </div>

        {lockedExotic && (
          <div className="locked-exotic">
            <span>🔒 Locked: {lockedExotic.name}</span>
            <button onClick={clearLockedExotic} className="clear-btn">×</button>
          </div>
        )}

        <button 
          className="exotic-selector-btn"
          onClick={() => setShowExoticSelector(true)}
        >
          {lockedExotic ? 'Change Exotic' : 'Lock Exotic'}
        </button>
      </div>

      {/* Input Interface */}
      <div className="creator-interface">
        {activeTab === 'natural' ? (
          <div className="natural-interface">
            <NaturalLanguageInput
              onSubmit={handleNaturalLanguageSubmit}
              isGenerating={isGenerating}
              placeholder="Describe your ideal build... (e.g., 'High recovery Warlock void build for raids')"
            />
          </div>
        ) : (
          <div className="advanced-interface">
            <div className="advanced-options">
              <div className="option-group">
                <label>Guardian Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="any">Any Class</option>
                  <option value="titan">Titan</option>
                  <option value="hunter">Hunter</option>
                  <option value="warlock">Warlock</option>
                </select>
              </div>

              <div className="option-group">
                <label>Activity Type</label>
                <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                  {activities.map(activity => (
                    <option key={activity.value} value={activity.value}>
                      {activity.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="option-group">
                <label>Subclass Element</label>
                <select value={selectedSubclass || ''} onChange={(e) => setSelectedSubclass(e.target.value || null)}>
                  {subclasses.map(subclass => (
                    <option key={subclass.value || 'auto'} value={subclass.value || ''}>
                      {subclass.icon ? `${subclass.icon} ${subclass.label}` : subclass.label}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                className="generate-btn advanced"
                onClick={handleAdvancedGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Optimal Build'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <strong>Build Generation Error:</strong> {error}
          </div>
          <button onClick={() => setError(null)} className="dismiss-error">×</button>
        </div>
      )}

      {/* Build Results */}
      <div className="build-results">
        {isGenerating && (
          <div className="generating-indicator">
            <div className="loading-spinner"></div>
            <p>AI is analyzing optimal builds...</p>
            <small>Processing {currentRequest}</small>
          </div>
        )}

        {builds.length > 0 && (
          <div className="builds-grid">
            <div className="results-header">
              <h3>Generated Builds ({builds.length})</h3>
              <p>AI-optimized builds for: "{currentRequest}"</p>
            </div>
            
            {builds.map((build, index) => (
              <div key={index} className="build-result">
                <div className="build-header">
                  <h4>{build.metadata?.name || `Build ${index + 1}`}</h4>
                  <div className="build-score">
                    Score: {build.score || 0}/100
                  </div>
                  {build.metadata?.isAlternative && (
                    <span className="alternative-badge">Alternative {build.metadata.variant}</span>
                  )}
                </div>
                
                <BuildDisplay 
                  build={build} 
                  onItemChange={(slot, newItem) => handleItemChange(index, slot, newItem)}
                  onSave={() => handleSaveBuild(build)}
                  showAdvanced={true}
                />
              </div>
            ))}
          </div>
        )}

        {builds.length === 0 && !isGenerating && !error && (
          <div className="empty-state">
            <h3>Ready to Generate Builds</h3>
            <p>Use natural language or advanced options to create your perfect Destiny 2 build.</p>
          </div>
        )}
      </div>

      {/* Exotic Selector Modal */}
      {showExoticSelector && (
        <div className="exotic-selector-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Exotic to Lock</h3>
              <button onClick={() => setShowExoticSelector(false)}>×</button>
            </div>
            
            <div className="exotic-list">
              {availableExotics.map(exotic => (
                <button
                  key={exotic.hash}
                  className="exotic-item"
                  onClick={() => handleExoticLock(exotic)}
                >
                  <img src={`https://www.bungie.net${exotic.icon}`} alt={exotic.name} />
                  <span>{exotic.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}