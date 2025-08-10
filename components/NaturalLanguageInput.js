import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../pages/_app'
import { BuildIntelligence } from '../lib/destiny-intelligence/build-intelligence'

export default function NaturalLanguageInput({ 
  value, 
  onChange, 
  onSubmit, 
  lockedExotic, 
  useInventoryOnly,
  session
}) {
  const { manifest } = useContext(AppContext)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [buildIntelligence, setBuildIntelligence] = useState(null)
  const [analysisPreview, setAnalysisPreview] = useState(null)

  // Initialize build intelligence
  useEffect(() => {
    if (manifest) {
      const intelligence = new BuildIntelligence();
      intelligence.initialize(manifest).then(() => {
        setBuildIntelligence(intelligence);
      });
    }
  }, [manifest]);

  const handleInputChange = async (e) => {
    const input = e.target.value
    onChange(input)
    
    // Generate intelligent suggestions and preview analysis
    if (input.length > 2 && buildIntelligence) {
      await generateIntelligentSuggestions(input)
      await generateAnalysisPreview(input)
    } else {
      setSuggestions([])
      setAnalysisPreview(null)
    }
  }

  const generateIntelligentSuggestions = async (input) => {
    try {
      const intelligentSuggestions = await buildIntelligence.generateBuildSuggestions(input, {
        maxSuggestions: 5,
        includeExotic: !!lockedExotic,
        prioritizeInventory: useInventoryOnly
      });

      // Combine intelligent suggestions with fallback suggestions
      const fallbackSuggestions = [
        'High DPS build for boss damage',
        'PVP build for Crucible',
        'Add clear build for strikes',
        'Survivability build for GMs',
        'Support build for raids',
        'Grenade spam build',
        'Void 3.0 devour build',
        'Solar 3.0 healing build',
        'Arc 3.0 chain lightning build'
      ].filter(suggestion =>
        suggestion.toLowerCase().includes(input.toLowerCase())
      );

      const combinedSuggestions = [
        ...intelligentSuggestions.map(s => s.suggestion),
        ...fallbackSuggestions
      ].slice(0, 5);

      setSuggestions(combinedSuggestions);
    } catch (error) {
      console.error('Error generating intelligent suggestions:', error);
      // Fallback to simple suggestions
      const simpleSuggestions = [
        'High DPS build for boss damage',
        'PVP build for Crucible',
        'Add clear build for strikes',
        'Survivability build for GMs'
      ].filter(suggestion =>
        suggestion.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(simpleSuggestions);
    }
  }

  const generateAnalysisPreview = async (input) => {
    try {
      const preview = await buildIntelligence.analyzeRequest(input, {
        includeKeywords: true,
        includeSynergies: true,
        includeStatPriorities: true
      });

      setAnalysisPreview(preview);
    } catch (error) {
      console.error('Error generating analysis preview:', error);
      setAnalysisPreview(null);
    }
  }

  const handleSubmit = async (inputText = value) => {
    if (!inputText.trim() || !manifest || !buildIntelligence) return

    setIsGenerating(true)
    setSuggestions([])

    try {
      // Use intelligent build generation
      const intelligentBuild = await buildIntelligence.generateOptimalBuild(inputText, {
        lockedExotic,
        useInventoryOnly,
        userSession: session,
        includeAnalysis: true,
        maxAlternatives: 3
      });

      onSubmit(intelligentBuild)
    } catch (error) {
      console.error('Error generating intelligent build:', error)
      
      // Fallback to API endpoint
      try {
        const response = await fetch('/api/generate-intelligent-build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: inputText,
            lockedExotic,
            useInventoryOnly,
            sessionId: session?.user?.id
          })
        });

        if (response.ok) {
          const build = await response.json();
          onSubmit(build);
        } else {
          throw new Error('API request failed');
        }
      } catch (apiError) {
        console.error('API fallback failed:', apiError);
        // Show error to user
      }
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
          placeholder="Describe what you want your build to do... (e.g., 'High DPS void build with grenades for raids' or 'PVP build focused on mobility and hand cannons')"
          className="language-input"
          rows={3}
          disabled={isGenerating}
        />
        
        <button 
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isGenerating || !buildIntelligence}
          className="generate-build-btn"
        >
          {isGenerating ? 'Generating Intelligent Build...' : 'Generate Build'}
        </button>
      </div>

      {/* Analysis Preview */}
      {analysisPreview && !isGenerating && (
        <div className="analysis-preview">
          <div className="analysis-header">Build Analysis Preview:</div>
          <div className="analysis-content">
            {analysisPreview.keywords && (
              <div className="keywords">
                <span className="label">Keywords:</span>
                {analysisPreview.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            )}
            {analysisPreview.statPriorities && (
              <div className="stat-priorities">
                <span className="label">Focus Stats:</span>
                <span className="stats">{analysisPreview.statPriorities.join(', ')}</span>
              </div>
            )}
            {analysisPreview.expectedSynergies && analysisPreview.expectedSynergies.length > 0 && (
              <div className="synergies">
                <span className="label">Expected Synergies:</span>
                <span className="synergy-count">{analysisPreview.expectedSynergies.length} detected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intelligent Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          <div className="suggestions-header">
            {buildIntelligence ? 'Intelligent Suggestions:' : 'Suggestions:'}
          </div>
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

      {/* Loading State */}
      {isGenerating && (
        <div className="generating-overlay">
          <div className="generating-spinner"></div>
          <p>
            {buildIntelligence 
              ? 'Analyzing synergies and optimizing your build...' 
              : 'Crafting your build...'
            }
          </p>
          <div className="generating-details">
            <span>• Parsing build requirements</span>
            <span>• Calculating stat synergies</span>
            <span>• Optimizing item combinations</span>
            <span>• Validating build viability</span>
          </div>
        </div>
      )}

      {/* Intelligence Status */}
      {!buildIntelligence && manifest && (
        <div className="intelligence-status">
          <span>🧠 Initializing build intelligence...</span>
        </div>
      )}
    </div>
  )
}