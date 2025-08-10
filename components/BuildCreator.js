import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../pages/_app'
import { BuildIntelligence } from '../lib/destiny-intelligence/build-intelligence'
import { SynergyEngine } from '../lib/destiny-intelligence/synergy-engine'

export default function BuildCreator({ onExoticSelected, selectedExotic, session }) {
  const { manifest } = useContext(AppContext)
  const [exotics, setExotics] = useState([])
  const [filteredExotics, setFilteredExotics] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedSlot, setSelectedSlot] = useState('all')
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [synergyEngine, setSynergyEngine] = useState(null)
  const [intelligentSuggestions, setIntelligentSuggestions] = useState([])
  const [synergyPreview, setSynergyPreview] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Initialize intelligence systems
  useEffect(() => {
    if (manifest) {
      const initializeIntelligence = async () => {
        try {
          const intelligence = new BuildIntelligence()
          await intelligence.initialize(manifest)
          setBuildIntelligence(intelligence)

          const synergy = new SynergyEngine()
          await synergy.initialize(manifest)
          setSynergyEngine(synergy)

          // Get intelligent exotic suggestions
          const suggestions = await intelligence.getTopExoticSuggestions({
            limit: 6,
            includePopular: true,
            includeMeta: true,
            includeVersatile: true
          })
          setIntelligentSuggestions(suggestions)
        } catch (error) {
          console.error('Failed to initialize intelligence systems:', error)
        }
      }

      initializeIntelligence()
    }
  }, [manifest])

  // Load exotic armor pieces
  useEffect(() => {
    if (manifest) {
      loadExoticArmor()
    }
  }, [manifest])

  // Filter exotics based on search and filters
  useEffect(() => {
    filterExotics()
  }, [exotics, searchTerm, selectedClass, selectedSlot])

  // Analyze synergies when exotic is selected
  useEffect(() => {
    if (selectedExotic && synergyEngine) {
      analyzeSynergies()
    }
  }, [selectedExotic, synergyEngine])

  const loadExoticArmor = async () => {
    try {
      const armorItems = await manifest.getItemsByCategory('armor')
      const exoticArmor = []

      for (const [hash, item] of armorItems) {
        if (item.tier === 'Exotic' && item.itemType === 2) { // Armor items
          exoticArmor.push({
            ...item,
            hash: hash
          })
        }
      }

      // Sort by name
      exoticArmor.sort((a, b) => a.name.localeCompare(b.name))
      setExotics(exoticArmor)
    } catch (error) {
      console.error('Error loading exotic armor:', error)
    }
  }

  const filterExotics = () => {
    let filtered = exotics

    // Text search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(exotic => 
        exotic.name.toLowerCase().includes(search) ||
        exotic.description.toLowerCase().includes(search) ||
        (exotic.intelligence?.triggers?.some(t => 
          t.type.toLowerCase().includes(search) ||
          t.condition.toLowerCase().includes(search)
        ))
      )
    }

    // Class filter
    if (selectedClass !== 'all') {
      const classTypeMap = { 'titan': 0, 'hunter': 1, 'warlock': 2 }
      filtered = filtered.filter(exotic => exotic.classType === classTypeMap[selectedClass])
    }

    // Slot filter
    if (selectedSlot !== 'all') {
      const slotMap = {
        'helmet': 'Helmet',
        'gauntlets': 'Gauntlets', 
        'chest': 'Chest Armor',
        'legs': 'Leg Armor'
      }
      filtered = filtered.filter(exotic => exotic.armorType === slotMap[selectedSlot])
    }

    setFilteredExotics(filtered)
  }

  const analyzeSynergies = async () => {
    if (!selectedExotic || !synergyEngine) return

    setIsAnalyzing(true)
    try {
      const synergies = await synergyEngine.findSynergies(selectedExotic.hash, {
        includeWeapons: true,
        includeMods: true,
        includeSubclasses: true,
        maxResults: 10
      })

      setSynergyPreview({
        exotic: selectedExotic,
        synergies: synergies,
        score: synergies.reduce((sum, s) => sum + s.strength, 0)
      })
    } catch (error) {
      console.error('Error analyzing synergies:', error)
      setSynergyPreview(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExoticClick = (exotic) => {
    onExoticSelected(exotic)
  }

  const getClassIcon = (classType) => {
    const classNames = ['Titan', 'Hunter', 'Warlock']
    return classNames[classType] || 'Unknown'
  }

  const getSlotIcon = (armorType) => {
    const slotIcons = {
      'Helmet': '🪖',
      'Gauntlets': '🧤',
      'Chest Armor': '🛡️',
      'Leg Armor': '🦵'
    }
    return slotIcons[armorType] || '⚙️'
  }

  const getIntelligenceBadge = (exotic) => {
    if (!exotic.intelligence) return null

    const triggerCount = exotic.intelligence.triggers?.length || 0
    const complexity = exotic.intelligence.metadata?.complexity || 0

    if (triggerCount === 0) return null

    if (complexity > 3) return 'Complex'
    if (complexity > 1) return 'Synergy'
    return 'Simple'
  }

  return (
    <div className="build-creator">
      <div className="exotic-selection-section">
        <div className="section-header">
          <h3>Select Exotic Armor (Optional)</h3>
          <p>Choose an exotic to build around, or leave empty for AI to suggest the best option</p>
        </div>

        {/* Intelligent Suggestions */}
        {intelligentSuggestions.length > 0 && (
          <div className="intelligent-suggestions">
            <h4>🧠 Recommended Exotics</h4>
            <div className="suggestion-grid">
              {intelligentSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`suggestion-card ${selectedExotic?.hash === suggestion.hash ? 'selected' : ''}`}
                  onClick={() => handleExoticClick(suggestion)}
                >
                  <div className="suggestion-header">
                    <span className="suggestion-name">{suggestion.name}</span>
                    <span className="suggestion-badge">{suggestion.reason}</span>
                  </div>
                  <div className="suggestion-description">
                    {suggestion.shortDescription}
                  </div>
                  {suggestion.synergies && (
                    <div className="suggestion-synergies">
                      <span>🔗 {suggestion.synergies} synergies</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search exotics by name, description, or abilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <div className="filters">
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Classes</option>
              <option value="titan">Titan</option>
              <option value="hunter">Hunter</option>
              <option value="warlock">Warlock</option>
            </select>

            <select 
              value={selectedSlot} 
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Slots</option>
              <option value="helmet">Helmet</option>
              <option value="gauntlets">Gauntlets</option>
              <option value="chest">Chest Armor</option>
              <option value="legs">Leg Armor</option>
            </select>
          </div>
        </div>

        {/* Selected Exotic Preview */}
        {selectedExotic && (
          <div className="selected-exotic-preview">
            <div className="preview-header">
              <h4>Selected: {selectedExotic.name}</h4>
              <button 
                onClick={() => onExoticSelected(null)}
                className="clear-selection-btn"
              >
                Clear Selection
              </button>
            </div>
            <div className="preview-content">
              <div className="preview-info">
                <span className="preview-class">{getClassIcon(selectedExotic.classType)}</span>
                <span className="preview-slot">{getSlotIcon(selectedExotic.armorType)}</span>
                {selectedExotic.intelligence && (
                  <span className="preview-intelligence">
                    🧠 {getIntelligenceBadge(selectedExotic)}
                  </span>
                )}
              </div>
              <div className="preview-description">
                {selectedExotic.description}
              </div>
            </div>
          </div>
        )}

        {/* Synergy Preview */}
        {synergyPreview && (
          <div className="synergy-preview">
            <div className="synergy-header">
              <h4>🔗 Synergy Analysis</h4>
              {isAnalyzing && <span className="analyzing">Analyzing...</span>}
            </div>
            {synergyPreview.synergies.length > 0 ? (
              <div className="synergy-list">
                {synergyPreview.synergies.slice(0, 3).map((synergy, index) => (
                  <div key={index} className="synergy-item">
                    <div className="synergy-info">
                      <span className="synergy-name">{synergy.item.name}</span>
                      <span className={`synergy-strength strength-${synergy.strength}`}>
                        {synergy.strength >= 0.8 ? 'Strong' : synergy.strength >= 0.5 ? 'Good' : 'Weak'}
                      </span>
                    </div>
                    <div className="synergy-reason">{synergy.reason}</div>
                  </div>
                ))}
                {synergyPreview.synergies.length > 3 && (
                  <div className="synergy-more">
                    +{synergyPreview.synergies.length - 3} more synergies detected
                  </div>
                )}
              </div>
            ) : (
              <div className="no-synergies">
                No strong synergies detected. This exotic works well independently.
              </div>
            )}
          </div>
        )}

        {/* Exotic Grid */}
        <div className="exotic-grid">
          {filteredExotics.map((exotic) => (
            <div
              key={exotic.hash}
              className={`exotic-card ${selectedExotic?.hash === exotic.hash ? 'selected' : ''}`}
              onClick={() => handleExoticClick(exotic)}
            >
              <div className="exotic-header">
                <div className="exotic-name">{exotic.name}</div>
                <div className="exotic-meta">
                  <span className="exotic-class">{getClassIcon(exotic.classType)}</span>
                  <span className="exotic-slot">{getSlotIcon(exotic.armorType)}</span>
                  {exotic.intelligence && (
                    <span className="exotic-intelligence">
                      {getIntelligenceBadge(exotic)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="exotic-description">
                {exotic.description.length > 120 
                  ? `${exotic.description.substring(0, 120)}...`
                  : exotic.description
                }
              </div>

              {exotic.intelligence?.triggers && exotic.intelligence.triggers.length > 0 && (
                <div className="exotic-triggers">
                  <div className="trigger-count">
                    {exotic.intelligence.triggers.length} trigger{exotic.intelligence.triggers.length > 1 ? 's' : ''}
                  </div>
                  <div className="trigger-preview">
                    {exotic.intelligence.triggers[0].type}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredExotics.length === 0 && (
          <div className="no-results">
            <p>No exotic armor found matching your criteria.</p>
            <button onClick={() => {
              setSearchTerm('')
              setSelectedClass('all')
              setSelectedSlot('all')
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}