import { useState, useContext } from 'react'
import { AppContext } from '../pages/_app'
import { parseLanguageInput } from '../lib/language-parser'
import { generateBuild } from '../lib/build-scorer'

export default function NaturalLanguageInput({ 
  value, 
  onChange, 
  onSubmit, 
  lockedExotic, 
  useInventoryOnly,
  userSession
}) {
  const { manifest } = useContext(AppContext)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const handleInputChange = (e) => {
    const input = e.target.value
    onChange(input)
    
    // Generate suggestions based on input
    if (input.length > 2) {
      generateSuggestions(input)
    } else {
      setSuggestions([])
    }
  }

  const generateSuggestions = (input) => {
    const commonSuggestions = [
      'High DPS build for boss damage',
      'PVP build for Crucible',
      'Add clear build for strikes',
      'Survivability build for GMs',
      'Support build for raids',
      'Grenade spam build',
      'Unlimited abilities build',
      'Void 3.0 devour build',
      'Solar 3.0 healing build',
      'Arc 3.0 chain lightning build',
      'Strand grapple build',
      'Build for Vault of Glass',
      'Build for Nightfall GMs',
      'Build for Trials of Osiris',
      'Build for Gambit'
    ]

    const filtered = commonSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    )

    setSuggestions(filtered.slice(0, 5))
  }

  const handleSubmit = async (inputText = value) => {
    if (!inputText.trim() || !manifest) return

    setIsGenerating(true)
    setSuggestions([])

    try {
      // Parse the natural language input
      const parsedRequest = parseLanguageInput(inputText, manifest)
      
      // Generate the build based on parsed request
      const build = await generateBuild({
        request: parsedRequest,
        lockedExotic,
        useInventoryOnly,
        userSession: userSession,
        manifest
      })

      onSubmit(build)
    } catch (error) {
      console.error('Error generating build:', error)
      // Handle error - maybe show a notification
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion)
    setSuggestions([])
    handleSubmit(suggestion)
  }

  return (
    <div className="natural-language-input">
      <div className="input-container">
        <textarea
          value={value}
          onChange={handleInputChange}
          placeholder="Describe what you want your build to do... (e.g., 'High DPS build for raid bosses' or 'PVP build with hand cannons')"
          className="language-input"
          rows={3}
          disabled={isGenerating}
        />
        
        <button 
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isGenerating}
          className="generate-build-btn"
        >
          {isGenerating ? 'Generating Build...' : 'Generate Build'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <div className="suggestions-header">Suggestions:</div>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="generating-overlay">
          <div className="generating-spinner"></div>
          <p>Analyzing your request and crafting the perfect build...</p>
        </div>
      )}
    </div>
  )
}