// components/EnhancedBuildCreator.js
// Enhanced Build Creator component with full BIS integration

import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import BuildDisplay from './BuildDisplay'
import NaturalLanguageInput from './NaturalLanguageInput'

export default function EnhancedBuildCreator() {
  const { session } = useAuth()
  
  // Build generation state
  const [builds, setBuilds] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [continuationToken, setContinuationToken] = useState(null)
  
  // Build options state
  const [useInventoryOnly, setUseInventoryOnly] = useState(true)
  const [selectedClass, setSelectedClass] = useState('any')
  const [selectedActivity, setSelectedActivity] = useState('general_pve')
  const [selectedSubclass, setSelectedSubclass] = useState(null)
  const [lockedExotic, setLockedExotic] = useState(null)
  const [currentRequest, setCurrentRequest] = useState('')
  
  // UI state
  const [activeTab, setActiveTab] = useState('natural') // 'natural' or 'advanced'
  const [showExoticSelector, setShowExoticSelector] = useState(false)
  const [availableExotics, setAvailableExotics] = useState([])

  // Activity types
  const activities = [
    { value: 'general_pve', label: 'General PvE' },
    { value: 'raid', label: 'Raid' },
    { value: 'dungeon', label: 'Dungeon' },
    { value: 'pvp', label: 'PvP (Crucible)' },
    { value: 'gambit', label: 'Gambit' },
    { value: 'nightfall', label: 'Nightfall' },
    { value: 'trials', label: 'Trials of Osiris' }
  ]

  // Subclass options
  const subclasses = [
    { value: null, label: 'Auto-Select Best' },
    { value: 'arc', label: 'Arc', icon: '⚡' },
    { value: 'solar', label: 'Solar', icon: '☀️' },
    { value: 'void', label: 'Void', icon: '🟣' },
    { value: 'stasis', label: 'Stasis', icon: '❄️' },
    { value: 'strand', label: 'Strand', icon: '🕸️' },
    { value: 'prismatic', label: 'Prismatic', icon: '🌈' }
  ]

  // Load available exotics on mount
  useEffect(() => {
    if (session?.user) {
      loadAvailableExotics()
    }
  }, [session, useInventoryOnly])

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
    await generateBuilds(request)
  }

  const handleAdvancedGenerate = async () => {
    // Build request from advanced options
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
    await generateBuilds(request)
  }

  const generateBuilds = async (request, isLoadMore = false) => {
    if (!session?.user) {
      setError('Please sign in to generate builds')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/builds/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          request,
          useInventoryOnly,
          maxBuilds: 10,
          lockedExotic,
          preferredSubclass: selectedSubclass,
          activityType: selectedActivity,
          continuationToken: isLoadMore ? continuationToken : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate builds')
      }

      const data = await response.json()
      
      if (data.builds && data.builds.length > 0) {
        if (isLoadMore) {
          setBuilds(prev => [...prev, ...data.builds])
        } else {
          setBuilds(data.builds)
        }
        
        setContinuationToken(data.metadata?.continuationToken)
      } else {
        throw new Error('No builds could be generated with the specified criteria')
      }
      
    } catch (error) {
      console.error('Build generation error:', error)
      setError(error.message || 'Failed to generate builds')
      
      if (!isLoadMore) {
        setBuilds([])
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLoadMore = async () => {
    if (currentRequest && continuationToken) {
      await generateBuilds(currentRequest, true)
    }
  }

  const handleItemChange = async (buildIndex, slot, newItem) => {
    // Update the build with the new item
    setBuilds(prev => {
      const updated = [...prev]
      updated[buildIndex] = {
        ...updated[buildIndex],
        [slot]: newItem,
        metadata: {
          ...updated[buildIndex].metadata,
          modified: true,
          modifiedAt: new Date().toISOString()
        }
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

  return (
    <div className="enhanced-build-creator">
      <div className="creator-header">
        <h2>Build Intelligence System</h2>
        <p>Create perfect Destiny 2 builds using AI-powered optimization</p>
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
            {useInventoryOnly ? 'Using your items only' : 'Using all game items'}
          </span>
        </div>

        <div className="option-group">
          <label>Activity Type</label>
          <select 
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="activity-select"
          >
            {activities.map(activity => (
              <option key={activity.value} value={activity.value}>
                {activity.label}
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>Subclass</label>
          <select 
            value={selectedSubclass || ''}
            onChange={(e) => setSelectedSubclass(e.target.value || null)}
            className="subclass-select"
          >
            {subclasses.map(subclass => (
              <option key={subclass.value || 'auto'} value={subclass.value || ''}>
                {subclass.icon} {subclass.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="input-tabs">
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

      {/* Input Section */}
      <div className="input-section">
        {activeTab === 'natural' ? (
          <div className="natural-input">
            <NaturalLanguageInput
              onSubmit={handleNaturalLanguageSubmit}
              disabled={isGenerating}
              placeholder="Describe your ideal build... (e.g., 'High DPS solar Warlock build for raids' or 'PvP Hunter with max mobility using Stompees')"
            />
            
            {/* Example Prompts */}
            <div className="example-prompts">
              <span className="prompt-label">Try:</span>
              <button 
                className="prompt-chip"
                onClick={() => handleNaturalLanguageSubmit('High DPS build for raid bosses')}
              >
                Raid DPS
              </button>
              <button 
                className="prompt-chip"
                onClick={() => handleNaturalLanguageSubmit('Survivability build for grandmaster nightfalls')}
              >
                GM Survivability
              </button>
              <button 
                className="prompt-chip"
                onClick={() => handleNaturalLanguageSubmit('PvP build with high mobility and recovery')}
              >
                PvP Mobility
              </button>
              <button 
                className="prompt-chip"
                onClick={() => handleNaturalLanguageSubmit('Void 3.0 devour build with Nezarec\'s Sin')}
              >
                Void Devour
              </button>
            </div>
          </div>
        ) : (
          <div className="advanced-input">
            {/* Class Selection */}
            <div className="form-group">
              <label>Guardian Class</label>
              <div className="class-buttons">
                <button 
                  className={`class-btn ${selectedClass === 'titan' ? 'active' : ''}`}
                  onClick={() => setSelectedClass('titan')}
                >
                  Titan
                </button>
                <button 
                  className={`class-btn ${selectedClass === 'hunter' ? 'active' : ''}`}
                  onClick={() => setSelectedClass('hunter')}
                >
                  Hunter
                </button>
                <button 
                  className={`class-btn ${selectedClass === 'warlock' ? 'active' : ''}`}
                  onClick={() => setSelectedClass('warlock')}
                >
                  Warlock
                </button>
                <button 
                  className={`class-btn ${selectedClass === 'any' ? 'active' : ''}`}
                  onClick={() => setSelectedClass('any')}
                >
                  Any
                </button>
              </div>
            </div>

            {/* Exotic Lock */}
            <div className="form-group">
              <label>Lock Exotic (Optional)</label>
              {lockedExotic ? (
                <div className="locked-exotic">
                  <img 
                    src={`https://www.bungie.net${lockedExotic.icon}`} 
                    alt={lockedExotic.name}
                    className="exotic-icon"
                  />
                  <span className="exotic-name">{lockedExotic.name}</span>
                  <button 
                    className="clear-btn"
                    onClick={clearLockedExotic}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button 
                  className="select-exotic-btn"
                  onClick={() => setShowExoticSelector(true)}
                >
                  Select Exotic
                </button>
              )}
            </div>

            {/* Generate Button */}
            <button 
              className="generate-btn primary"
              onClick={handleAdvancedGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Builds'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Build Display */}
      <BuildDisplay
        builds={builds}
        onLoadMore={handleLoadMore}
        onItemChange={handleItemChange}
        isGenerating={isGenerating}
      />

      {/* Exotic Selector Modal */}
      {showExoticSelector && (
        <div className="modal-overlay" onClick={() => setShowExoticSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Exotic</h3>
            <div className="exotic-grid">
              {availableExotics.map(exotic => (
                <div 
                  key={exotic.hash}
                  className="exotic-option"
                  onClick={() => handleExoticLock(exotic)}
                >
                  <img 
                    src={`https://www.bungie.net${exotic.icon}`}
                    alt={exotic.name}
                  />
                  <span>{exotic.name}</span>
                  <span className="exotic-type">
                    {exotic.itemType === 2 ? 'Armor' : 'Weapon'}
                  </span>
                </div>
              ))}
            </div>
            <button 
              className="modal-close"
              onClick={() => setShowExoticSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}