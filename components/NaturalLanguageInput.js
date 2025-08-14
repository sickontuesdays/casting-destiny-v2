import { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../pages/_app'

export default function NaturalLanguageInput({ 
  onBuildGenerated, 
  buildRequest, 
  setBuildRequest,
  useInventoryOnly = false,
  lockedExotic = null,
  disabled = false 
}) {
  const { buildIntelligence, isIntelligenceReady } = useContext(AppContext)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState(null)
  const [parsePreview, setParsePreview] = useState(null)
  const inputRef = useRef(null)

  // Sample suggestions for user guidance
  const sampleRequests = [
    "High mobility Hunter build for PvP",
    "Titan build with maximum resilience for raids",
    "Warlock build focused on grenade spam",
    "Build around Celestial Nighthawk for DPS",
    "Solar build with high recovery for dungeon runs",
    "Void build for crowd control in strikes"
  ]

  useEffect(() => {
    if (buildRequest.length > 3) {
      debouncePreview(buildRequest)
    } else {
      setParsePreview(null)
    }
  }, [buildRequest])

  const debouncePreview = (() => {
    let timeoutId
    return (input) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        generatePreview(input)
      }, 500)
    }
  })()

  const generatePreview = async (input) => {
    if (!isIntelligenceReady() || !buildIntelligence) return

    try {
      const parsed = await buildIntelligence.parseRequest(input)
      setParsePreview(parsed)
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setBuildRequest(value)
    setError(null)

    // Show suggestions when input is empty or short
    if (value.length <= 2) {
      setSuggestions(sampleRequests)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setBuildRequest(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!buildRequest.trim()) {
      setError('Please describe the build you want to create')
      return
    }

    if (!isIntelligenceReady()) {
      setError('AI Intelligence system is not ready. Please try again in a moment.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🤖 Generating build from request:', buildRequest)
      
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getStatusMessage = () => {
    if (isGenerating) return 'Generating your perfect build...'
    if (disabled) return 'AI Intelligence system is loading...'
    if (!isIntelligenceReady()) return 'Intelligence system unavailable'
    return 'Describe your ideal build'
  }

  return (
    <div className="natural-language-input">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={buildRequest}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => !buildRequest && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Describe your ideal build... (e.g., 'High mobility Hunter build for PvP')"
              className={`build-input ${error ? 'error' : ''}`}
              disabled={disabled || isGenerating}
              rows={3}
            />
            
            <div className="input-status">
              <span className={`status-text ${isGenerating ? 'generating' : ''}`}>
                {getStatusMessage()}
              </span>
              {isIntelligenceReady() && (
                <span className="ai-indicator">🧠 AI Enhanced</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || isGenerating || !buildRequest.trim() || !isIntelligenceReady()}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                Generating...
              </>
            ) : (
              'Generate Build'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            <div className="suggestions-header">
              <span>Try these examples:</span>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Parse Preview */}
        {parsePreview && !showSuggestions && (
          <div className="parse-preview">
            <h4>I understand you want:</h4>
            <div className="preview-grid">
              {parsePreview.entities?.classes?.length > 0 && (
                <div className="preview-item">
                  <span className="preview-label">Class:</span>
                  <span className="preview-value">{parsePreview.entities.classes.join(', ')}</span>
                </div>
              )}
              {parsePreview.entities?.activities?.length > 0 && (
                <div className="preview-item">
                  <span className="preview-label">Activity:</span>
                  <span className="preview-value">{parsePreview.entities.activities.join(', ')}</span>
                </div>
              )}
              {parsePreview.entities?.stats?.length > 0 && (
                <div className="preview-item">
                  <span className="preview-label">Focus Stats:</span>
                  <span className="preview-value">{parsePreview.entities.stats.join(', ')}</span>
                </div>
              )}
              {parsePreview.entities?.exotics?.length > 0 && (
                <div className="preview-item">
                  <span className="preview-label">Exotics:</span>
                  <span className="preview-value">{parsePreview.entities.exotics.join(', ')}</span>
                </div>
              )}
              <div className="preview-item">
                <span className="preview-label">Confidence:</span>
                <span className="preview-value">{Math.round(parsePreview.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Build Options Summary */}
        {(useInventoryOnly || lockedExotic) && (
          <div className="build-options">
            <h4>Build Constraints:</h4>
            <ul>
              {useInventoryOnly && (
                <li>✓ Using only items from your inventory</li>
              )}
              {lockedExotic && (
                <li>🔒 Build will include: {lockedExotic.name}</li>
              )}
            </ul>
          </div>
        )}
      </form>
    </div>
  )
}