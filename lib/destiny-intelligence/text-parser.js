export class TextParser {
  constructor() {
    this.initialized = false
    this.keywords = {
      classes: ['hunter', 'titan', 'warlock'],
      activities: ['raid', 'pvp', 'crucible', 'nightfall', 'dungeon', 'strike', 'gambit', 'trials', 'patrol'],
      stats: ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength', 'weapons', 'health', 'class', 'super', 'grenade', 'melee'],
      elements: ['solar', 'arc', 'void', 'stasis', 'strand'],
      playstyles: ['aggressive', 'defensive', 'balanced', 'speed', 'tank', 'support', 'dps', 'damage'],
      weapons: ['hand cannon', 'pulse rifle', 'scout rifle', 'auto rifle', 'submachine gun', 'sidearm', 'bow', 'sniper', 'shotgun', 'fusion rifle', 'linear fusion', 'rocket launcher', 'grenade launcher', 'machine gun', 'sword'],
      modifiers: ['high', 'max', 'maximum', 'low', 'minimum', 'focused', 'optimized'],
      intents: ['build', 'create', 'make', 'generate', 'optimize', 'improve', 'suggest', 'recommend'],
      exoticNames: [] // Will be populated from manifest
    }
    this.patterns = {
      statValues: /(\d+)\s*(mobility|resilience|recovery|discipline|intellect|strength|weapons|health|class|super|grenade|melee)/gi,
      buildRequests: /(build|loadout|setup|create)/i,
      activityMentions: /(for|in|during)\s*(raid|pvp|crucible|nightfall|dungeon|strike|gambit|trials)/gi,
      statFocus: /(high|max|maximum|focused|prioritize)\s*(mobility|resilience|recovery|discipline|intellect|strength|weapons|health|class|super|grenade|melee)/gi
    }
  }

  async initialize(manifestData) {
    try {
      this.buildItemKeywords(manifestData)
      this.initialized = true
      console.log('✅ Text Parser initialized')
      return true
    } catch (error) {
      console.error('❌ Text Parser initialization failed:', error)
      return false
    }
  }

  buildItemKeywords(manifestData) {
    if (!manifestData?.data?.DestinyInventoryItemDefinition) return

    const items = manifestData.data.DestinyInventoryItemDefinition
    const exoticNames = []
    
    Object.values(items).forEach(item => {
      if (item.tierType === 6 && item.displayProperties?.name) { // Exotic items
        exoticNames.push(item.displayProperties.name.toLowerCase())
      }
    })

    this.keywords.exoticNames = exoticNames
    console.log(`📝 Loaded ${exoticNames.length} exotic item names`)
  }

  parseUserInput(input) {
    if (!this.initialized) {
      console.warn('Text Parser not initialized')
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0
      }
    }

    try {
      const normalizedInput = input.toLowerCase().trim()
      
      const result = {
        intent: this.detectIntent(normalizedInput),
        entities: this.extractEntities(normalizedInput),
        confidence: this.calculateConfidence(normalizedInput),
        originalInput: input,
        normalizedInput: normalizedInput,
        patterns: this.extractPatterns(normalizedInput)
      }

      console.log('🔍 Parsed input result:', result)
      return result
      
    } catch (error) {
      console.error('Error parsing user input:', error)
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        error: error.message
      }
    }
  }

  detectIntent(input) {
    // Build creation intents
    if (this.containsKeywords(input, ['build', 'loadout', 'setup'])) {
      if (this.containsKeywords(input, ['high', 'max', 'maximum', 'optimize'])) {
        return 'build_optimize'
      }
      if (this.containsKeywords(input, ['create', 'make', 'generate'])) {
        return 'build_create'
      }
      return 'build_general'
    }

    // Activity-specific intents
    if (this.containsKeywords(input, ['raid'])) {
      return 'activity_raid'
    }
    if (this.containsKeywords(input, ['pvp', 'crucible', 'trials'])) {
      return 'activity_pvp'
    }
    if (this.containsKeywords(input, ['dungeon'])) {
      return 'activity_dungeon'
    }
    if (this.containsKeywords(input, ['nightfall', 'gm', 'grandmaster'])) {
      return 'activity_nightfall'
    }

    // Stat optimization intents
    if (this.containsKeywords(input, this.keywords.stats)) {
      return 'stat_focus'
    }

    // Exotic recommendation intents
    if (this.containsKeywords(input, ['exotic', 'best', 'recommend']) || 
        this.keywords.exoticNames.some(name => input.includes(name))) {
      return 'exotic_recommendation'
    }

    // Synergy analysis intents
    if (this.containsKeywords(input, ['synergy', 'work with', 'combo', 'combination'])) {
      return 'synergy_analysis'
    }

    return 'general_question'
  }

  extractEntities(input) {
    const entities = {}

    // Extract class mentions
    entities.classes = this.extractKeywordMatches(input, this.keywords.classes)

    // Extract activity mentions
    entities.activities = this.extractKeywordMatches(input, this.keywords.activities)

    // Extract stat mentions
    entities.stats = this.extractKeywordMatches(input, this.keywords.stats)

    // Extract element mentions
    entities.elements = this.extractKeywordMatches(input, this.keywords.elements)

    // Extract playstyle mentions
    entities.playstyles = this.extractKeywordMatches(input, this.keywords.playstyles)

    // Extract weapon type mentions
    entities.weapons = this.extractKeywordMatches(input, this.keywords.weapons)

    // Extract exotic mentions
    entities.exotics = this.extractExoticMentions(input)

    // Extract numerical values
    entities.numbers = this.extractNumbers(input)

    // Extract modifiers
    entities.modifiers = this.extractKeywordMatches(input, this.keywords.modifiers)

    // Extract specific stat values
    entities.statValues = this.extractStatValues(input)

    return entities
  }

  extractKeywordMatches(input, keywords) {
    const matches = []
    keywords.forEach(keyword => {
      if (input.includes(keyword)) {
        matches.push(keyword)
      }
    })
    return [...new Set(matches)] // Remove duplicates
  }

  extractExoticMentions(input) {
    const matches = []
    this.keywords.exoticNames.forEach(exoticName => {
      if (input.includes(exoticName)) {
        matches.push(exoticName)
      }
    })
    return matches
  }

  extractNumbers(input) {
    const numberPattern = /\b\d+\b/g
    const matches = input.match(numberPattern)
    return matches ? matches.map(num => parseInt(num)) : []
  }

  extractStatValues(input) {
    const statValues = {}
    const matches = input.matchAll(this.patterns.statValues)
    
    for (const match of matches) {
      const value = parseInt(match[1])
      const stat = match[2].toLowerCase()
      statValues[stat] = value
    }
    
    return statValues
  }

  extractPatterns(input) {
    const patterns = {}
    
    // Build request patterns
    patterns.buildRequests = this.patterns.buildRequests.test(input)
    
    // Activity mentions
    const activityMatches = [...input.matchAll(this.patterns.activityMentions)]
    patterns.activityMentions = activityMatches.map(match => ({
      activity: match[2],
      context: match[1]
    }))
    
    // Stat focus patterns
    const statFocusMatches = [...input.matchAll(this.patterns.statFocus)]
    patterns.statFocus = statFocusMatches.map(match => ({
      modifier: match[1],
      stat: match[2]
    }))
    
    return patterns
  }

  calculateConfidence(input) {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on recognized keywords
    const totalKeywords = Object.values(this.keywords).flat().length
    let recognizedKeywords = 0
    
    Object.values(this.keywords).forEach(keywordSet => {
      keywordSet.forEach(keyword => {
        if (input.includes(keyword)) {
          recognizedKeywords++
        }
      })
    })
    
    const keywordRatio = recognizedKeywords / Math.min(totalKeywords, 20)
    confidence += keywordRatio * 0.3
    
    // Increase confidence for clear patterns
    if (this.patterns.buildRequests.test(input)) {
      confidence += 0.2
    }
    
    if (this.patterns.statFocus.test(input)) {
      confidence += 0.15
    }
    
    if (this.patterns.activityMentions.test(input)) {
      confidence += 0.1
    }
    
    // Decrease confidence for very short or very long inputs
    if (input.length < 10) {
      confidence -= 0.2
    } else if (input.length > 200) {
      confidence -= 0.1
    }
    
    return Math.max(0, Math.min(1, confidence))
  }

  containsKeywords(input, keywords) {
    return keywords.some(keyword => input.includes(keyword))
  }

  // Analysis methods for understanding user intent depth
  analyzeComplexity(input) {
    const complexity = {
      level: 'simple',
      factors: [],
      score: 0
    }
    
    // Check for multiple requirements
    const entityCount = Object.values(this.extractEntities(input))
      .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : Object.keys(arr).length), 0)
    
    if (entityCount > 5) {
      complexity.level = 'complex'
      complexity.factors.push('multiple_requirements')
      complexity.score += 2
    } else if (entityCount > 2) {
      complexity.level = 'moderate'
      complexity.factors.push('several_requirements')
      complexity.score += 1
    }
    
    // Check for conditional statements
    if (input.includes('if') || input.includes('when') || input.includes('unless')) {
      complexity.factors.push('conditional_logic')
      complexity.score += 1
    }
    
    // Check for comparisons
    if (input.includes('better than') || input.includes('instead of') || input.includes('vs')) {
      complexity.factors.push('comparative_analysis')
      complexity.score += 1
    }
    
    // Check for optimization language
    if (this.containsKeywords(input, ['optimize', 'perfect', 'ideal', 'best possible'])) {
      complexity.factors.push('optimization_request')
      complexity.score += 1
    }
    
    return complexity
  }

  extractConstraints(input) {
    const constraints = []
    
    // Inventory constraints
    if (input.includes('inventory') || input.includes('items i have') || input.includes('gear i own')) {
      constraints.push({
        type: 'inventory_only',
        description: 'Use only items from user inventory'
      })
    }
    
    // Exotic constraints
    this.keywords.exoticNames.forEach(exotic => {
      if (input.includes(exotic)) {
        constraints.push({
          type: 'locked_exotic',
          value: exotic,
          description: `Build must include ${exotic}`
        })
      }
    })
    
    // Stat constraints
    const statMatches = input.matchAll(this.patterns.statValues)
    for (const match of statMatches) {
      constraints.push({
        type: 'stat_requirement',
        stat: match[2],
        value: parseInt(match[1]),
        description: `${match[2]} must be ${match[1]}`
      })
    }
    
    return constraints
  }

  // Utility methods
  isInitialized() {
    return this.initialized
  }

  getKeywords() {
    return { ...this.keywords }
  }

  getPatterns() {
    return { ...this.patterns }
  }

  // Method to add custom keywords (for user-specific terms)
  addCustomKeywords(category, keywords) {
    if (this.keywords[category]) {
      this.keywords[category] = [...this.keywords[category], ...keywords]
    } else {
      this.keywords[category] = keywords
    }
  }

  // Method to get parsing statistics
  getParsingStats(input) {
    const entities = this.extractEntities(input)
    const patterns = this.extractPatterns(input)
    const complexity = this.analyzeComplexity(input)
    
    return {
      inputLength: input.length,
      entitiesFound: Object.values(entities).flat().length,
      patternsMatched: Object.values(patterns).filter(Boolean).length,
      complexity: complexity.level,
      confidence: this.calculateConfidence(input.toLowerCase())
    }
  }
}